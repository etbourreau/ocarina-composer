const MeasureCmp = {
  props: ["data", "signature"],
  methods: {
    isFull() {
      let sum = 0;
      this.notes.forEach((note) => {
        sum += note.duration;
      });
      return sum < this.signature;
    },
    addNote(noteIndex) {
      let durationAvail = this.signature;
      this.notes.forEach((note) => {
        durationAvail -= note.duration;
      });
      durationAvail = durationAvail > this.signature ? 1 : durationAvail;
      this.notes.push({
        note: NOTES[noteIndex],
        duration: durationAvail,
      });
    },
  },
  template: `
        <div class="measure">
            <NoteCmp v-for="(note, i) in data.notes"
              :key="i"
              :data="note"
              :signature="signature"
              @update="$emit('update')"
              @delete="$emit('deletenote', i)"
              @add="$emit('addnote', i)">
            </NoteCmp>
        </div>
    `,
};