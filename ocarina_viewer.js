const OcarinaViewerCmp = {
    props: ["note"],
    setup(props) {
      let holes = [];
      props.note.holes.forEach((i) => {
        holes.push(HOLES_TRANSCO[i]);
      });
      return {
        note: props.note,
        holes: holes,
      };
    },
    template: `
        <div class="ocarina-viewer">
          <svg namespace="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 330 146">
            <circle v-for="hole in holes"
              :cx="hole.x"
              :cy="hole.y"
              :r="hole.r"
              class="finger">
            </circle>
          </svg>
          <div class="img"></div>
          <p class="label" v-html="note.label"></p>
        </div>
      `,
  };