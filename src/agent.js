const AgentStates = {
  "ENTERING": 99,
  "ENTERED": 100,
  "MOVING": 101,
  "QUEUING": 102,
  "EXITING": 103,
  "REACHED": 104,
  "RIDING": 108,
  "FINISHED": 105,
  "EXITED": 106,
  "LEFT": 107,
  "WAITING_REUNION": 109
};

const AgentTheme = {
  solo_priority: { color: "#3B82F6", stroke: "#1E3A8A" }, // Biru
  group_priority: { color: "#60A5FA", stroke: "#1E3A8A" }, // Biru muda
  group: { color: "#EC4899", stroke: "#831843" }, // Pink
  solo: { color: "#bbe70e", stroke: "#064E3B" }, // Hijau muda
  family: { color: "#F59E0B", stroke: "#B45309" }, // Oranye
  exiting: { color: "#9CA3AF", stroke: "#374151" }, // Abu-abu
  waiting: { color: "#D1D5DB", stroke: "#4B5563" } // Menunggu (abu-abu terang)
};

Object.freeze(AgentStates);

class Agent {
  constructor(map, type = "SOLO", priority = false, size = 1, numAdults = 1, numChildren = 0, passedMinHeight = null) {
    this.map = map;
    this.agentState = AgentStates.ENTERING;
    this.x = map.entrance.x;
    this.y = map.entrance.y;
    
    this.type = type; 
    this.priority = priority;
    this.size = size;
    this.numAdults = numAdults;
    this.numChildren = numChildren;

    // Tambahkan baris-baris ini di bagian bawah dalam constructor agent.js
    this.id = ++globalAgentIDCounter;
    
    // Format jam masuk (Misal: "10:30")
    let h = Math.floor(currentHour).toString().padStart(2, '0');
    let m = Math.floor(currentMinute).toString().padStart(2, '0');
    this.entryTimeStr = `${h}:${m}`;
    
    this.rideHistoryLog = []; // Buku harian tempat mencatat nama wahana dan jam

    // --- SIMULASI FISIK TINGGI BADAN ---
    if (passedMinHeight !== null) {
        this.minHeightGroup = passedMinHeight;
    } else {
        let minH = 999;
        // Bangkitkan tinggi badan orang dewasa
        for(let i = 0; i < numAdults; i++) {
            minH = Math.min(minH, random(150, 185));
        }
        // Bangkitkan tinggi badan anak-anak
        for(let i = 0; i < numChildren; i++) {
            minH = Math.min(minH, random(90, 140));
        }
        // Fallback untuk grup dewasa / solo reguler
        if (numAdults === 0 && numChildren === 0) {
            for(let i = 0; i < size; i++) {
                minH = Math.min(minH, random(150, 185));
            }
        }
        this.minHeightGroup = Math.floor(minH); // Simpan tinggi terpendek dari anggota grup
    }

    this.curNode = map.entrance;
    this.enteredTime = frameRunning;
    this.timeSpentQueuing = 0;
    this.numRidesTaken = 0;
    this.visitedRides = [];

    this.isSplitPart = false;
    this.parentAgent = null;
    this.waitingForParts = 0; 
    this.tempChildrenAgent = null;

    this.pendingSize = 0; // Memori untuk mengembalikan ukuran rombongan

    this.setThemeAndPreferences();
    this.moveSpeed = 0.5 + (Math.random() * 0.7);
  }

  setThemeAndPreferences() {
    if (this.priority) {
      this.style = this.size > 1 ? AgentTheme.group_priority : AgentTheme.solo_priority;
      // Fast track tidak peduli antrean (m2 kecil), pilih yang terdekat saja
      this.m1 = 0.8; this.m2 = 0.2;
      this.limit = 60; 
    } else if (this.type === "GROUP_FAMILY") {
      this.style = AgentTheme.family;
      // Keluarga lumayan malas jalan jauh, tapi tetap menghindari antrean gila
      this.m1 = 0.5; this.m2 = 0.5;
      this.limit = 30;
    } else if (this.size > 1) {
      this.style = AgentTheme.group;
      // Grup teman FOKUS mencari antrean sepi untuk memaksimalkan wahana!
      this.m1 = 0.2; this.m2 = 0.8;
      this.limit = 40; 
    } else {
      this.style = AgentTheme.solo;
      // Solo traveler SANGAT FOKUS pada antrean sepi (Strategi paling efisien)
      this.m1 = 0.1; this.m2 = 0.9;
      this.limit = 50; 
    }
  }

  // Clone untuk membuat entitas pecahan
  // Perbarui cloneSplit agar mewariskan tinggi badan
  cloneSplit(newSize, isChildrenOnly = false) {
    // Jika hanya anak-anak yang dipecah (masuk wahana anak), bangkitkan tinggi anak baru
    let childMinHeight = isChildrenOnly ? Math.floor(random(90, 140)) : this.minHeightGroup;
    let clone = new Agent(this.map, this.type, this.priority, newSize, 0, isChildrenOnly ? newSize : 0, childMinHeight);
    
    clone.x = this.x; clone.y = this.y;
    clone.curNode = this.curNode;
    clone.targetNode = this.targetNode;
    clone.isSplitPart = true;
    clone.parentAgent = this;
    this.waitingForParts++;
    return clone;
  }

  getColorByState() {
    if (this.agentState === AgentStates.WAITING_REUNION) return AgentTheme.waiting.color;
    switch (this.agentState) {
      case AgentStates.QUEUING: return "#32f50b"; 
      case AgentStates.REACHED: return "#EF4444"; 
      case AgentStates.RIDING: return "#8B5CF6"; 
      case AgentStates.EXITING: return AgentTheme.exiting.color;
      default: return this.style.color;
    }
  }

  nextDestination() {
    if (this.waitingForParts > 0) {
      this.agentState = AgentStates.WAITING_REUNION;
      return;
    }

    if (this.pendingSize > 0) {
        this.size += this.pendingSize;
        this.pendingSize = 0;
    }

    let wantsToLeave = false;
    
    // --- KEPUTUSAN PULANG BERDASARKAN WAKTU & KEPUASAN ---
    if (this.numRidesTaken > 0) {
        let hoursLeft = parkCloseHour - (currentHour + currentMinute / 60);
        let fatigueFactor = Math.pow((this.numRidesTaken / 8), 2);
        let dynamicDepartureProb = 0.00;
        
        if (hoursLeft <= 3.0) {
            dynamicDepartureProb = ((3 - hoursLeft) / 3) * 0.15 * fatigueFactor;
            if (this.map.getAverageQueueTime() > this.limit) {
                dynamicDepartureProb += 0.10; 
            }
        }
        
        if (Math.random() < dynamicDepartureProb) {
            wantsToLeave = true;
        }
        if (hoursLeft <= 0.5) {
            wantsToLeave = true;
        }
    }

    if (wantsToLeave) {
      this.targetNode = this.map.entrance;
      this.agentState = AgentStates.EXITING;
    } else {
        // AWAL STRATEGI HIERARCHICAL ROUTING & PWT
        let allRides = this.map.rides;
        
        if (typeof this.currentZone === "undefined") {
            this.currentZone = Math.floor(Math.random() * 4) + 1; 
            this.pwtThreshold = this.limit + 10; 
        }
        
        let isVisited = (ride) => {
            return this.visitedRides.includes(ride);
        };

        let targetFound = false;
        let zonesChecked = 0;
        let fallbackRides = []; 

        // Jika pengunjung tipe SOLO atau FastTrack, mereka jadi "SPEEDRUNNER"
        // Mereka menggunakan Global Greedy Search (Melihat seluruh map sekaligus)
        let isGlobalSearch = (this.type === "SOLO" || this.priority); 
        let maxLoop = isGlobalSearch ? 1 : 4; 

        // Lapisan Makro: Siklus Looping
        while (zonesChecked < maxLoop && !targetFound) {
            let validCandidates = [];

            let availableInZone = allRides.filter(ride => {
                // 🔥 JIKA GLOBAL SEARCH, ABAIKAN FILTER ZONA! 🔥
                if (!isGlobalSearch && ride.zone !== this.currentZone) return false;
                
                if (isVisited(ride)) return false;
                if (this.type === "GROUP_FAMILY" && ride.rideCategory === "dewasa") return false;
                if (this.type !== "GROUP_FAMILY" && ride.rideCategory === "anak-anak") return false;
                if (this.minHeightGroup < ride.minHeight) return false;
                if (!ride.isOpen()) return false;
                return true;
            });

            // Kalkulasi PWT (Dilengkapi X-Ray Vision & Strict Threshold)
            for (let ride of availableInZone) {
                let startNodeIndex = this.map.nodes.indexOf(this.curNode);
                let endNodeIndex = this.map.nodes.indexOf(ride);
                
                if (startNodeIndex === -1 || endNodeIndex === -1) continue;

                let walkDist = this.map.dist[startNodeIndex][endNodeIndex];
                let walkTime = walkDist / 100; 
                
                let waitTime = this.getTrueWaitTime(ride); 
                let rideTime = ride.runtime || 5; 

                let currentTimeMins = (currentHour * 60) + currentMinute;
                let closingTimeMins = (parkCloseHour * 60); 
                
                // 1. KESADARAN WAKTU TUTUP WAHANA
                let rideClosingMins = (ride.closeHour * 60) + ride.closeMinute; 
                let expectedFinishTime = currentTimeMins + walkTime + waitTime + rideTime;
                
                if (expectedFinishTime > (rideClosingMins - 5)) continue; 

                // ============================================================
                // 2. STRATEGI GEDUNG INDOOR (ICE AGE, KONTIKI, PLAYGROUND)
                // ============================================================
                let indoorRides = ["Ride 7", "Ride 10", "Ride 12"];
                let indoorBonus = 0;
                
                // Jika agen sedang berada di gedung indoor DAN mengecek wahana di gedung yang sama
                if (indoorRides.includes(this.curNode.rideName) && indoorRides.includes(ride.rideName)) {
                    indoorBonus = -200; // Beri diskon ekstrem agar diprioritaskan mutlak!
                }

                // 3. LOGIKA PENALTI POPULARITAS (DYNAMIC PENALTY)
                let popMod = 0;
                if (ride.isPopular) {
                    if (waitTime <= 30) {
                        popMod = -5; 
                    } else if (waitTime > 45) {
                        popMod = (waitTime - 45) * 0.5; 
                    }
                }

                // 4. MODE PANIK SORE HARI
                let isDesperate = ((closingTimeMins - currentTimeMins) <= 120 && this.numRidesTaken < 2);
                let pwt = 0;
                
                if (isDesperate) {
                    // Masukkan indoorBonus ke dalam kalkulasi
                    pwt = waitTime + (walkTime * 0.1) + indoorBonus; 
                } else {
                    // Masukkan indoorBonus ke dalam kalkulasi
                    pwt = (this.m1 * walkTime) + (this.m2 * waitTime) + popMod + indoorBonus;
                }

                // 5. BATAS ABSOLUT YANG SANGAT KETAT
                let maxTolerance = this.priority ? 90 : 75;

                // Jika mereka di indoor, paksa masukkan ke fallback meski antrean agak panjang
                if (waitTime <= maxTolerance || indoorBonus < 0) {
                    fallbackRides.push({ ride: ride, pwt: pwt });
                }

                // 6. KANDIDAT UTAMA
                let absoluteMaxWait = this.limit + 15; 
                if (pwt <= this.pwtThreshold && waitTime <= absoluteMaxWait) {
                    validCandidates.push({ ride: ride, pwt: pwt });
                }
            }

            if (validCandidates.length > 0) {
                validCandidates.sort((a, b) => a.pwt - b.pwt);
                this.targetNode = validCandidates[0].ride;
                this.agentState = AgentStates.MOVING;
                targetFound = true;
            } else {
                // Pindah zona hanya jika menggunakan Hierarchical Routing (Bukan Global)
                if (!isGlobalSearch) {
                    this.currentZone = (this.currentZone % 4) + 1;
                }
                zonesChecked++;
            }
        }

        // Keputusan Darurat (Fallback)
        if (!targetFound) {
            if (fallbackRides.length > 0) {
                fallbackRides.sort((a, b) => a.pwt - b.pwt);
                this.targetNode = fallbackRides[0].ride;
                this.agentState = AgentStates.MOVING;
            } else {
                this.targetNode = this.map.entrance;
                this.agentState = AgentStates.EXITING;
            }
        }
    }

    this.path = this.map.getPathToNode(this.curNode, this.targetNode);
    if (this.path && this.path.length > 0) this.path.shift();
    this.startMoving();
  }

  startMoving() {
    // Cegah error jika agen sudah berada di titik tujuan
    if (!this.path || this.path.length === 0) {
      this.targetX = this.x;
      this.targetY = this.y;
      this.timeRequired = 0.001; // Mencegah pembagian dengan nol
      this.lerpT = 1;
      return;
    }

    this.curNode = this.path[0];
    this.targetX = this.path[0].x;
    this.targetY = this.path[0].y;
    this.initialX = this.x;
    this.initialY = this.y;
    this.lerpT = 0; 
    
    // Cegah timeRequired menjadi 0 yang menghasilkan angka Infinity
    let d = dist(this.x, this.y, this.targetX, this.targetY);
    this.timeRequired = d / this.moveSpeed;
    
    if (this.timeRequired <= 0) {
        this.timeRequired = 0.001; 
    }
  }
  update() {
    if (this.agentState === AgentStates.WAITING_REUNION) return; 

    switch (this.agentState) {
      case AgentStates.ENTERING:
        if (this.map.getAverageQueueTime() > this.limit && Math.random() < CROWD_TURNAWAY_PROB) this.agentState = AgentStates.LEFT;
        else this.agentState = AgentStates.ENTERED;
        break;
      case AgentStates.ENTERED:
        this.nextDestination();
        break;
      case AgentStates.MOVING: case AgentStates.EXITING:
        this.lerpT += (deltaTime / 1000 * TIME_ACCELERATION) / this.timeRequired;
        if (this.lerpT >= 1) {
          this.x = this.targetX; this.y = this.targetY;
          
          if (this.curNode === this.targetNode || !this.path || this.path.length === 0) {
            if (this.agentState === AgentStates.MOVING) {
                this.agentState = AgentStates.REACHED;
            } else if (this.agentState === AgentStates.EXITING) {
                this.agentState = AgentStates.EXITED;
            }
          } else {
            this.path.shift();
            this.startMoving();
          }
        }
        break;
        
      case AgentStates.EXITED:
      case AgentStates.LEFT:
        // Biarkan main.js yang menghapus agen ini di fungsi removeAgents().
        // Ini mencegah infinite loop jika update() terpanggil pada agen yang sudah mati.
        break;
      
      case AgentStates.REACHED:
        if (!this.targetNode.isOpen()){
          this.visitedRides.push(this.targetNode);
          this.agentState = AgentStates.FINISHED;
          break;
        }

        // ====================================
        // BALKING (Membatalkan Niat Saat Tiba)
        // ====================================
        let realWaitTime = this.getTrueWaitTime(this.targetNode);
        let currentTimeMins = (currentHour * 60) + currentMinute;
        
        // PERBAIKAN: Gunakan jam tutup wahana target
        let rideClosingMins = (this.targetNode.closeHour * 60) + this.targetNode.closeMinute; 
        
        let expectedFinish = currentTimeMins + realWaitTime + (this.targetNode.runtime || 5);
        
        let absoluteMaxWait = this.limit + 15;
        let isDesperate = (((parkCloseHour * 60) - currentTimeMins) <= 120 && this.numRidesTaken < 2);

        // SYARAT BALKING:
        // Jika antrean melebihi rasionalitas ATAU diprediksi tidak keburu sebelum WAHANA tutup!
        if ((!isDesperate && realWaitTime > absoluteMaxWait * 2) || (expectedFinish > rideClosingMins - 5)) {
            
            // Pengunjung kecewa melihat realita waktu, mereka batal masuk!
            this.visitedRides.push(this.targetNode); // Coret dari daftar hari ini
            this.agentState = AgentStates.FINISHED;  // Langsung cari wahana lain / pulang
            break;
        }

        // =============================================================
        // Jika lolos Balking, baru diizinkan masuk ke wahana
        if (this.targetNode.isContinuous) {
            let occ = this.targetNode.getCurrentOccupancy();
            if (occ + this.size <= this.targetNode.capacity) {
                if (this.type === "GROUP_FAMILY" && this.targetNode.rideCategory === "anak-anak" && !this.isSplitPart) {
                    let childrenAgent = this.cloneSplit(this.numChildren, true);
                    this.tempChildrenAgent = childrenAgent;
                    agents.push(childrenAgent); 
                    this.targetNode.admitContinuous(childrenAgent); 
                    this.agentState = AgentStates.WAITING_REUNION; 
                } else {
                    this.targetNode.admitContinuous(this);
                }
            } else {
                // Tertolak karena penuh
                this.visitedRides.push(this.targetNode);
                this.agentState = AgentStates.FINISHED; 
            }
        } 
        else {
            if (this.type === "GROUP_FAMILY" && this.targetNode.rideCategory === "anak-anak" && !this.isSplitPart) {
               let childrenAgent = this.cloneSplit(this.numChildren, true);
               this.tempChildrenAgent = childrenAgent;
               agents.push(childrenAgent); 
               
               let priorityVal = (this.priority && this.targetNode.hasFastTrack) ? 1 : 0;
               this.targetNode.enqueue(childrenAgent, priorityVal);
               
               this.agentState = AgentStates.WAITING_REUNION; 
            } else {
               let priorityVal = (this.priority && this.targetNode.hasFastTrack) ? 1 : 0;
               this.targetNode.enqueue(this, priorityVal);
            }
        }
        break;
        
      case AgentStates.FINISHED:
        if (this.isSplitPart) {
          this.parentAgent.waitingForParts--;
          
          if (this.isCapacitySplit) {
              this.parentAgent.pendingSize += this.size;
          }
          
          if (this.startQueueTime) {
              this.parentAgent.timeSpentQueuing += this.timeSpentQueuing;
          }
          this.parentAgent.numRidesTaken = Math.max(this.parentAgent.numRidesTaken, this.numRidesTaken);
          if (this.targetNode) this.parentAgent.visitedRides.push(this.targetNode);

          // Selalu bangunkan induk jika dia sedang berstatus WAITING_REUNION
          if (this.parentAgent.waitingForParts <= 0 && this.parentAgent.agentState === AgentStates.WAITING_REUNION) {
            this.parentAgent.agentState = AgentStates.FINISHED; 
          }
          
          this.size = 0;
          this.agentState = AgentStates.EXITED; 
        } else {
          this.nextDestination();
        }
        break;
    }
  }

  startQueueing() {
    this.agentState = AgentStates.QUEUING;
    this.startQueueTime = secondsInSim;
  }

  // Sinkronisasi Mutlak Buku Harian & Variabel Angka
  startRiding() {
    this.agentState = AgentStates.RIDING; 
    
    if (this.startQueueTime) {
        const queueTimeMinutes = (secondsInSim - this.startQueueTime) / 60;
        this.timeSpentQueuing += queueTimeMinutes;
    }

    if (this.targetNode) {
        if (!this.visitedRides.includes(this.targetNode)) {
            this.visitedRides.push(this.targetNode);
        }
        if (this.isSplitPart && this.parentAgent) {
            if (!this.parentAgent.visitedRides.includes(this.targetNode)) {
                this.parentAgent.visitedRides.push(this.targetNode);
            }
        }
        
        let rideNameStr = this.targetNode.rideName || this.targetNode.name || "Ride";
        let h = Math.floor(currentHour).toString().padStart(2, '0');
        let m = Math.floor(currentMinute).toString().padStart(2, '0');
        let timeStr = h + ":" + m;
        let queueMins = this.startQueueTime ? Math.round((secondsInSim - this.startQueueTime) / 60) : 0;
        
        let logEntry = { name: rideNameStr, time: timeStr, queue: queueMins };

        if (this.isSplitPart && this.parentAgent && this.parentAgent.rideHistoryLog) {
            let exists = false;
            for(let r of this.parentAgent.rideHistoryLog) {
                if(r.name === logEntry.name) exists = true;
            }
            if (!exists) {
                this.parentAgent.rideHistoryLog.push(logEntry);
                // Paksa angka mengikuti panjang buku harian!
                this.parentAgent.numRidesTaken = this.parentAgent.rideHistoryLog.length;
            }
            
        } else if (this.rideHistoryLog) {
            let exists = false;
            for(let r of this.rideHistoryLog) {
                if(r.name === logEntry.name) exists = true;
            }
            if (!exists) {
                this.rideHistoryLog.push(logEntry);
                // Paksa angka mengikuti panjang buku harian!
                this.numRidesTaken = this.rideHistoryLog.length;
            }
        }
    }
  }

  doneRiding() {
    this.agentState = AgentStates.FINISHED;
  }

  draw() {
    stroke(0);
    strokeWeight(1);
    stroke(this.style.stroke);
    fill(this.getColorByState());
    
    if (this.agentState == AgentStates.MOVING || this.agentState == AgentStates.EXITING) {
      this.x = lerp(this.initialX, this.targetX, this.lerpT);
      this.y = lerp(this.initialY, this.targetY, this.lerpT);
    }

    // Menggambar ellipse sesuai jumlah orang
    for (var i = 0; i < this.size; i++) {
      ellipse(this.x, this.y + i * AGENT_RADIUS, AGENT_RADIUS);
    }
  }

  handleTimeout(rideNode) {
    const waitTimeMinutes = (this.map.waitLimit || 1); 
    this.timeSpentQueuing += waitTimeMinutes;
    if (Math.random() > 0.5) this.visitedRides.push(rideNode);
    this.agentState = AgentStates.FINISHED;
  }

  // ===========================================
  // X-RAY VISION UNTUK MEMBONGKAR ANTREAN ASLI
  // ===========================================
  getTrueWaitTime(rideNode) {
      let baseTime = rideNode.getQueueTime();

      // Akses data dari objek PriorityQueue dengan benar
      if (rideNode.queue && rideNode.queue._heap) {
          
          let totalPeople = 0;
          for (let q of rideNode.queue._heap) {
              // Di dalam _heap, data disimpan sebagai Array: [Priority, Agent]
              let agt = q[1]; 
              totalPeople += (agt.size || 1);
          }

          let calculatedWait = 0;
          let cap = rideNode.capacity || 10;
          
          if (!rideNode.isContinuous) {
              // WAHANA BATCH (Siklus penuh = Durasi Main + Durasi Bongkar Muat)
              let rt = rideNode.runtime || 5;
              let to = rideNode.turnover || 2; 
              let fullCycleTime = rt + to; 
              
              calculatedWait = Math.ceil(totalPeople / cap) * fullCycleTime;
          } else {
              // WAHANA CONTINUOUS (Interval jeda per kereta)
              let dispatchInterval = rideNode.interval || 1; 
              calculatedWait = Math.ceil(totalPeople / cap) * dispatchInterval;
          }
          
          // Ambil tebakan yang paling buruk/lama (Pesimis) agar agen tidak tertipu!
          return Math.max(baseTime, calculatedWait);
      }
      return baseTime;
  }
}