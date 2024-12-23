const NOTES = [
  {
    id: 0,
    label: "A-",
    height: 0,
    holes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    id: 1,
    label: "A&#9839;-",
    height: 0,
    holes: [0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    id: 2,
    label: "B-",
    height: 1,
    holes: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11],
  },
  {
    id: 3,
    label: "C",
    height: 2,
    holes: [0, 1, 2, 3, 6, 7, 8, 9, 10, 11],
  },
  {
    id: 4,
    label: "C&#9839;",
    height: 2,
    holes: [0, 1, 2, 3, 4, 6, 7, 8, 10, 11],
  },
  {
    id: 5,
    label: "D",
    height: 3,
    holes: [0, 1, 2, 3, 6, 7, 8, 10, 11],
  },
  {
    id: 6,
    label: "D&#9839;",
    height: 3,
    holes: [0, 1, 2, 3, 4, 6, 7, 10, 11],
  },
  {
    id: 7,
    label: "E",
    height: 4,
    holes: [0, 1, 2, 3, 6, 7, 10, 11],
  },
  {
    id: 8,
    label: "F",
    height: 5,
    holes: [0, 1, 2, 3, 6, 10, 11],
  },
  {
    id: 9,
    label: "F&#9839;",
    height: 5,
    holes: [0, 1, 2, 3, 8, 10, 11],
  },
  {
    id: 10,
    label: "G",
    height: 6,
    holes: [0, 1, 2, 3, 10, 11],
  },
  {
    id: 11,
    label: "G&#9839;",
    height: 6,
    holes: [0, 1, 3, 8, 10, 11],
  },
  {
    id: 12,
    label: "A",
    height: 7,
    holes: [0, 1, 3, 10, 11],
  },
  {
    id: 13,
    label: "A&#9839;",
    height: 7,
    holes: [0, 3, 8, 10, 11],
  },
  {
    id: 14,
    label: "B",
    height: 8,
    holes: [0, 3, 10, 11],
  },
  {
    id: 15,
    label: "C+",
    height: 9,
    holes: [3, 10, 11],
  },
  {
    id: 16,
    label: "C&#9839;+",
    height: 9,
    holes: [3, 8, 11],
  },
  {
    id: 17,
    label: "D+",
    height: 10,
    holes: [3, 11],
  },
  {
    id: 18,
    label: "D&#9839;+",
    height: 10,
    holes: [3, 8],
  },
  {
    id: 19,
    label: "E+",
    height: 11,
    holes: [3],
  },
  {
    id: 20,
    label: "F+",
    height: 12,
    holes: [],
  },
];
const MAX_NOTE_HEIGHT = NOTES.reduce((a, b) => Math.max(a, b.height), 0);

const HOLES_TRANSCO = [
  { r: 16, x: 29, y: 32 },
  { r: 16, x: 74, y: 32 },
  { r: 16, x: 118, y: 32 },
  { r: 16, x: 164, y: 32 },
  { r: 8, x: 210, y: 42 },
  { r: 8, x: 75, y: 62 },
  { r: 16, x: 164, y: 72 },
  { r: 16, x: 210, y: 72 },
  { r: 16, x: 254, y: 72 },
  { r: 16, x: 298, y: 72 },
  { r: 16, x: 74, y: 126 },
  { r: 16, x: 164, y: 126 },
];

const AUDIO_NOTES = [];
for (let i = 0; i < NOTES.length; i++) {
  AUDIO_NOTES.push(new Audio(`audio/${i}.mp3`));
}

const app = {
  setup() {
    return {
      header: ref(),
      songs: ref([]),
      selectedSong: ref(0),
      measures: ref([]),
      renderKey: ref(0),
      signature: ref(4),
      playInProgress: ref(false),
      playBar: ref(null),
    };
  },
  methods: {
    updateSignature(signature) {
      this.signature = signature;
      this.updateMeasures();
    },
    updateMeasures() {
      // flat notes
      let notes = [];
      this.measures.forEach((measure) => {
        measure.notes.forEach((note) => {
          note.duration = parseFloat(note.duration);
          notes.push(note);
        });
      });
      // decompress notes
      for (let i = 0; i < notes.length; i++) {
        while (notes[i].duration > this.signature) {
          notes[i].duration /= 2;
          notes.splice(i + 1, 0, {
            duration: notes[i].duration,
          });
        }
      }
      // remove useless silences
      let reduced = false;
      do {
        reduced = false;
        for (let i = 0; i < notes.length - 1; i++) {
          while (
            notes[i + 1] &&
            !notes[i].note &&
            !notes[i + 1].note &&
            notes[i].duration == notes[i + 1].duration &&
            notes[i].duration * 2 <= this.signature &&
            notes[i].duration * 2 <= 4
          ) {
            notes.splice(i + 1, 1);
            notes[i].duration *= 2;
            reduced = true;
          }
        }
      } while (reduced);
      let newMeasures = [];
      notes.forEach((note) => {
        if (!newMeasures[newMeasures.length - 1]) {
          newMeasures.push({
            notes: [],
          });
        }
        let lastMeasure = newMeasures[newMeasures.length - 1];
        let lastSum = 0;
        lastMeasure.notes.forEach((measureNote) => {
          lastSum += measureNote.duration;
        });
        if (lastSum + note.duration > this.signature) {
          newMeasures.push({
            notes: [],
          });
          lastMeasure = newMeasures[newMeasures.length - 1];
        }
        lastMeasure.notes.push(note);
      });
      this.measures = newMeasures;
      this.renderKey++;
    },
    addMeasure(notes) {
      this.measures.push({
        notes,
        add: false,
      });
      this.updateMeasures();
    },
    addNote(iMeasure, iPreviousNote) {
      if (
        this.measures[iMeasure] &&
        this.measures[iMeasure].notes[iPreviousNote]
      ) {
        this.measures[iMeasure].notes.splice(iPreviousNote + 1, 0, {
          note: NOTES[0],
          duration: 1,
        });
        this.renderKey++;
        this.updateMeasures();
      }
    },
    deleteNote(iMeasure, iNote) {
      if (this.measures.length == 1 && this.measures[0].notes.length == 1) {
        return;
      }
      if (this.measures[iMeasure] && this.measures[iMeasure].notes[iNote]) {
        this.measures[iMeasure].notes.splice(iNote, 1);
        this.renderKey++;
        this.updateMeasures();
      }
    },
    loadSong(index) {
      let song = this.songs[index];
      if (song) {
        this.measures = [];
        let notes = [];
        song.notes.forEach((note) => {
          notes.push({
            note: note.note != undefined && NOTES[note.note],
            duration: note.duration,
          });
        });
        this.addMeasure(notes);
      }
    },
    removeSong(index) {
      if (confirm("Are you sure?")) {
        this.songs.splice(index, 1);
        localStorage.setItem("songs", JSON.stringify(this.songs));
      }
    },
    saveSong(name, bpm, signature) {
      let existingIndex;
      this.songs.forEach((song, i) => {
        if (song.name == name) {
          existingIndex = i;
        }
      });

      let notes = [];
      this.measures.forEach((measure) => {
        measure.notes.forEach((note) => {
          note.duration = parseFloat(note.duration);
          notes.push({
            note: note.note && note.note.id,
            duration: note.duration,
          });
        });
      });
      if (existingIndex === undefined) {
        this.songs.push({});
        existingIndex = this.songs.length - 1;
      }
      this.songs[existingIndex] = {
        name: name,
        bpm: bpm,
        notes: notes,
      };
      if (signature != 4) {
        this.songs[existingIndex].signature = signature;
      }
      this.songs = this.songs.sort((a, b) => a.name.localeCompare(b.name));
      localStorage.setItem("songs", JSON.stringify(this.songs));
    },
    newSong() {
      this.measures = [];
      this.addMeasure([
        {
          duration: 1,
        },
      ]);
      this.signature = 4;
    },
    updateSongs(songs) {
      this.songs = songs;
      localStorage.setItem("songs", JSON.stringify(this.songs));
    },
    updatePlayBar(data) {
      this.playBar = data;
      this.playInProgress = data != null;
    },
    playFrom(iMeasure, iNote) {
      this.header.play({ measure: iMeasure, note: iNote });
    },
  },
  template: `
    <HeaderCmp
      ref="header"
      :songs="songs"
      :measures="measures"
      :signature="signature"
      @signature="updateSignature"
      @newsong="newSong"
      @loadsong="loadSong"
      @removesong="removeSong"
      @savesong="saveSong"
      @songsupdate="updateSongs"
      @playbar="updatePlayBar"/>
    <div class="container">
      <div class="measures">
        <MeasureCmp v-for="(measure, i) in measures"
          :key="i+'-'+renderKey"
          :data="measure"
          :signature="signature"
          :playInProgress="playInProgress"
          :notePlayed="playBar && playBar.measure == i ? playBar.note : null"
          @update="updateMeasures"
          @deletenote="function(iNote) { deleteNote(i, iNote) }"
          @addnote="function(iPreviousNote) {addNote(i, iPreviousNote)}"
          @playfrom="function(iNote) { playFrom(i, iNote) }">
        </MeasureCmp>
      </div>
    </div>
  `,
  mounted() {
    let songs = localStorage.getItem("songs");
    if (songs) {
      this.songs = JSON.parse(songs);
      this.songs = this.songs.sort((a, b) => a.name.localeCompare(b.name));
    }
    this.newSong();
  },
};

const { createApp, ref } = Vue;
createApp(app)
  .component("OcarinaViewerCmp", OcarinaViewerCmp)
  .component("NoteCmp", NoteCmp)
  .component("MeasureCmp", MeasureCmp)
  .component("HeaderCmp", HeaderCmp)
  .mount("#app");
