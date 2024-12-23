const NoteCmp = {
  props: ["data", "signature", "playInProgress", "played"],
  setup(props) {
    return {
      props: props,
      signature: props.signature,
      note: ref(props.data.note),
      height: ref((props.data.note && props.data.note.height) || 0),
      duration: ref(props.data.duration),
      sharp: ref(
        props.data.note && props.data.note.label.indexOf("&#9839;") != -1
      ),
      element: ref(),
    };
  },
  methods: {
    getNoteClasses() {
      return {
        x4: this.duration == 4,
        x2: this.duration == 2,
        "x-5": this.duration == 0.5,
        "x-25": this.duration == 0.25,
        "x-125": this.duration == 0.125,
      };
    },
    getNoteStyle() {
      return {
        bottom: `calc(${this.height} * .75em + .2em)`,
      };
    },
    isBar() {
      return this.duration < 4;
    },
    isBarInverted() {
      return this.note && this.note.height > MAX_NOTE_HEIGHT / 2;
    },
    getSubBarsAmount() {
      if (this.duration >= 1) {
        return 0;
      }
      let sum = 0;
      for (let i = 1; i > this.duration; i /= 2) {
        sum++;
      }
      return sum;
    },
    update(note, duration) {
      if (note && (!this.note || note.id != this.note.id)) {
        AUDIO_NOTES[note.id].play();
      }
      this.props.data.note = note;
      this.props.data.duration = duration || 1;
      this.note = note;
      this.height = (note && note.height) || 0;
      this.duration = duration;
      this.sharp = note && note.label.indexOf("&#9839;") != -1;
      this.$emit("update");
    },
    updateNote(event) {
      let notesBounds = [];
      let notesYDiff = event.target.clientHeight / 14;
      for (let i = 1; i < 14; i++) {
        let noteY = i * notesYDiff;
        let min = noteY - notesYDiff / 2;
        if (i == 1) {
          min = 0;
        }
        let max = noteY + notesYDiff / 2;
        if (i == 13) {
          max = event.target.clientHeight;
        }
        notesBounds.push({
          min: min,
          max: max,
        });
      }
      let cursorY = event.target.clientHeight - event.offsetY;
      notesBounds.forEach((bounds, i) => {
        if (cursorY >= bounds.min && cursorY <= bounds.max) {
          targetNote = NOTES.find((n) => n.height == i);
        }
      });
      if (this.note && targetNote.id == this.note.id) {
        this.duration /= 2;
        if (this.duration < 0.125) {
          this.duration = 4;
          while (this.duration > this.signature) {
            this.duration /= 2;
          }
          this.update(this.note, this.duration);
        }
        this.update(this.note, this.duration);
      } else {
        this.update(targetNote, this.duration);
      }
    },
    setSilent(event) {
      event.preventDefault();
      if (this.note) {
        // convert to silence
        this.update(null, this.duration);
      } else {
        // remove silence
        this.$emit("delete");
      }
    },
    isChangeNoteUp() {
      return this.note && this.note.id < NOTES.length - 1;
    },
    isChangeNoteDown() {
      return this.note && this.note.id > 0;
    },
    changeNote(up) {
      if (!this.note) {
        console.error("no note");
        return;
      }
      if (up) {
        let next = this.note.id + 1;
        if (NOTES[next]) {
          this.update(NOTES[this.note.id + 1], this.duration);
        }
      } else {
        let previous = this.note.id - 1;
        if (NOTES[previous]) {
          this.update(NOTES[this.note.id - 1], this.duration);
        }
      }
    },
    getSilenceSign() {
      if (this.note) {
        return "";
      }

      switch (this.duration) {
        case 4:
          return "𝄻";
        case 2:
          return "𝄼";
        case 1:
          return "𝄽";
        case 0.5:
          return "𝄾";
        case 0.25:
          return "𝄿";
        case 0.125:
          return "𝅀";
        default:
          return "";
      }
    },
  },
  watch: {
    played(newVal) {
      if (newVal) {
        this.element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "start",
        });
      }
    },
  },
  template: `
      <div class="note-wrapper" ref="element">
        <OcarinaViewerCmp v-if="note" :note="note"></OcarinaViewerCmp>
        <div v-else class="silence-wrapper">
          <p>Silence</p>
          <div>
            <label for="duration">Duration </label>
            <select id="duration" v-model="duration" @change="update(null, duration)">
              <option value="0.125">1/8</option>
              <option value="0.25">1/4</option>
              <option value="0.5">1/2</option>
              <option value="1">1</option>
              <option v-if="signature >= 2" value="2">2</option>
              <option v-if="signature >= 4" value="4">4</option>
            </select>
          </div>
        </div>
        <div class="measure-buttons">
            <div class="bg">
                <span v-for="(_, i) in 7" :key="i" class="row"></span>
            </div>
            <div class="note"
              v-if="note"
              :class="getNoteClasses()"
              :style="getNoteStyle()">
              <div v-if="sharp" class="sharp"></div>
              <div v-if="isBar()" class="bar" :class="{
                invert: isBarInverted(),
              }">
                <div v-for="(_, i) in getSubBarsAmount()" :key="i" class="sub-bar"></div>
              </div>
            </div>
            <div v-else class="silence-sign">
              <span>{{ getSilenceSign() }}</span>
            </div>
            <div class="toggle-area"
              @click="updateNote"
              @contextmenu="setSilent">
            </div>
            <div class="change-note" v-if="note">
              <div class="up"
                :class="{disabled: !isChangeNoteUp()}"
                @click="changeNote(true)">
              </div>
              <div class="down"
                :class="{disabled: !isChangeNoteDown()}"
                @click="changeNote(false)">
              </div>
            </div>
            <div class="add-note" @click="$emit('add')">
              <span>+</span>
            </div>
            <div class="play-bar" v-if="played"></div>
        </div>
        <div class="play-wrapper">
          <button class="btn-play small hoverable"
            :class="{disabled: !!playInProgress}"
            @click="!playInProgress && $emit('play')" />
        </div>
      </div>
    `,
};
