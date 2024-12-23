const HeaderCmp = {
  props: ["songs", "measures", "signature"],
  setup(props) {
    return {
      selectedSong: ref(0),
      playBpm: ref(100),
      playRepeat: ref(false),
      playProcess: ref(null),
      signature: ref(props.signature),
      lastSong: ref(""),
    };
  },
  watch: {
    sgnature(newVal) {
      this.signature = newVal;
    },
  },
  methods: {
    playTick() {
      if (!this.playProcess || this.playProcess.stopTimeout) {
        return;
      }
      let now = new Date().getTime();
      if (now >= this.playProcess.targetTime) {
        let note = this.playProcess.notes[this.playProcess.iNote];
        this.$emit("playbar", note.origin);
        if (note.audio) {
          note.audio.pause();
          note.audio.currentTime = 0;
          note.audio.play();
        }
        let noteDuration = (60000 / this.playBpm) * note.duration;
        if (this.playProcess.iNote < this.playProcess.notes.length - 1) {
          this.playProcess.iNote++;
          this.playProcess.targetTime = now + noteDuration;
        } else if (this.playRepeat && this.playProcess.countNotes > 2) {
          this.playProcess.iNote = 0;
          this.playProcess.targetTime = now + noteDuration;
        } else {
          this.playProcess.stopTimeout = setTimeout(this.stop, noteDuration);
        }
      }
    },
    play(fromOrigin) {
      let notes = [];
      let count = 0;
      let countActualNotes = 0;
      let startNote = 0;
      this.measures.forEach((measure, i) => {
        measure.notes.forEach((note, j) => {
          note.duration = parseFloat(note.duration);
          notes.push({
            audio: note.note && AUDIO_NOTES[note.note.id],
            duration: note.duration,
            origin: {
              measure: i,
              note: j,
            },
          });
          if (fromOrigin && fromOrigin.measure === i && fromOrigin.note === j) {
            startNote = count;
          }
          if (note.note) {
            countActualNotes++;
          }
          count++;
        });
      });

      this.playProcess = {
        process: setInterval(this.playTick, 1),
        notes: notes,
        countNotes: countActualNotes,
        iNote: startNote,
        targetTime: new Date().getTime(),
      };
    },
    stop() {
      this.$emit("playbar", null);
      clearInterval(this.playProcess.process);
      this.playProcess = null;
    },
    newSong() {
      this.lastSong = "";
      this.signature = 4;
      this.$emit("newsong");
      this.$emit("signature", this.signature);
      if (this.playProcess) {
        this.stop();
      }
    },
    loadSong() {
      this.lastSong = this.songs[this.selectedSong].name;
      this.playBpm = this.songs[this.selectedSong].bpm;
      this.signature = this.songs[this.selectedSong].signature || 4;
      this.$emit("loadsong", this.selectedSong);
      this.$emit("signature", this.signature);
      if (this.playProcess) {
        this.stop();
      }
    },
    saveSong() {
      if (this.playProcess) {
        this.stop();
      }
      let name = prompt("Song name", this.lastSong);
      name = name && name.trim();
      if (name && name.length > 0) {
        this.$emit("savesong", name, this.playBpm, this.signature);
      }
    },
    removeSong() {
      this.lastSong = "";
      this.$emit("removesong", this.selectedSong);
      this.selectedSong = 0;
      if (this.playProcess) {
        this.stop();
      }
    },
    removeAllSongs() {
      this.lastSong = "";
      this.$emit("removeallsong");
      this.selectedSong = 0;
      if (this.playProcess) {
        this.stop();
      }
    },
    changeSong() {
      this.lastSong = "";
      if (this.playProcess) {
        this.stop();
      }
    },
    exportSongs() {
      let songs = localStorage.getItem("songs");
      if (songs) {
        let a = document.createElement("a");
        let file = new Blob([songs], { type: "application/json" });
        a.href = URL.createObjectURL(file);
        a.download = "ocarina_songs.json";
        a.click();
      }
    },
    validateImportedSongs(data) {
      let converted = [];
      if (!Array.isArray(data)) {
        console.error("Invalid data", data);
        return false;
      } else if (data.length < 1) {
        console.error("Invalid songs length", data.length);
        return false;
      }

      for (let i = 0; i < data.length; i++) {
        let song = data[i];
        // Data validity check
        if (!song.name || song.name.length < 1) {
          console.error(`Invalid song ${i} name`, song.name);
          return false;
        } else if (
          !song.notes ||
          !Array.isArray(song.notes) ||
          song.notes.length < 1
        ) {
          console.error(`Invalid song ${i} notes`, song.notes);
          return false;
        } else if (song.bpm && isNaN(parseInt(song.bpm))) {
          console.error(`Invalid song ${i} bpm`, song.bpm);
          return false;
        } else if (song.signature && typeof song.signature !== "number") {
          console.error(`Invalid song ${i} signature`, song.signature);
          return false;
        }

        // data parsong and clamping
        song.bpm = song.bpm ? parseInt(song.bpm) : 100;
        song.bpm = Math.min(Math.max(song.bpm, 40), 220);

        if (!song.signature) {
          song.signature = 4;
        }
        song.signature = Math.min(Math.max(song.signature, 1), 8);

        let newNotes = [];
        // check notes
        for (let j = 0; j < song.notes.length; j++) {
          let note = song.notes[j];
          if (!note || typeof note !== "object") {
            console.error(`Invalid song ${i} note ${j}`, note);
            return false;
          } else if (!note.duration || typeof note.duration !== "number") {
            console.error(
              `Invalid song ${i} note ${j} duration`,
              note.duration
            );
            return false;
          } else if (
            note.note !== null &&
            (note.note < 0 || note.note >= NOTES.length)
          ) {
            console.error(`Invalid song ${i} note ${j} index`, note.note);
            return false;
          }
          newNotes.push({
            note: note.note,
            duration: note.duration,
          });
        }

        converted.push({
          name: song.name,
          bpm: song.bpm,
          notes: newNotes,
          signature: song.signature,
        });
      }
      return converted;
    },
    importSongs() {
      let input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.addEventListener("change", (e) => {
        let file = e.target.files[0];
        if (file) {
          let reader = new FileReader();
          reader.onload = (e) => {
            let songs = JSON.parse(e.target.result);
            songs = this.validateImportedSongs(songs);
            if (songs) {
              songs = songs.sort((a, b) => a.name.localeCompare(b.name));
              this.$emit("songsupdate", songs);
            }
          };
          reader.readAsText(file);
        }
      });
      input.click();
    },
    importDefaultSongs() {
      fetch("./default_songs.json")
        .then((resp) => resp.json())
        .then((songs) => {
          songs = this.validateImportedSongs(songs);
          if (songs) {
            songs = songs.sort((a, b) => a.name.localeCompare(b.name));
            this.$emit("songsupdate", songs);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    },
  },
  template: `
        <div class="header">
            <div class="left">
                <span class="flex-center">
                    <button v-if="!playProcess" class="btn-play" @click="play" />
                    <button v-else class="btn-play stop" @click="stop">Stop</button>
                    <input type="checkbox"
                        id="repeat"
                        class="repeat"
                        v-model="playRepeat" />
                    <label for="repeat"></label>
                </span>
                <span>
                    <input type="range" class="slider" min="40" max="220" v-model="playBpm">
                    <span> BPM {{playBpm}}</span>
                </span>
                <span>
                    <label for="signature">Signature </label>
                    <input type="number" min="1" max="8"
                        v-model="signature"
                        @change="$emit('signature', signature)" />
                    <span>/4</span>
                </span>
            </div>
            <div class="right">
                <button
                    v-if="measures.length > 1"
                    @click="newSong">New</button>
                <span v-if="songs.length >= 1">
                    <select v-if="songs.length > 1" v-model="selectedSong" @change="changeSong">
                        <option v-for="(song, i) in songs" :key="i" :value="i">{{song.name}}</option>
                    </select>
                    <span v-else>Song : {{songs[0].name}}</span>
                    <button @click="loadSong">Load</button>
                    <button @click="removeSong">Remove</button>
                </span>
                <button v-if="measures.length > 1" @click="saveSong">Save</button>
                <span>
                  <button @click="exportSongs">Export songs</button>
                  <button @click="importSongs">Import songs</button>
                  <button @click="importDefaultSongs" v-if="songs.length == 0">Import default songs</button>
                  <button @click="removeAllSongs" v-else>Remove all songs</button>
                </span>
            </div>
        </div>
    `,
};
