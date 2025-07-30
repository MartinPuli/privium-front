import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-TLGC4MCQ.js";
import "./chunk-RWDBEJVC.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-3VYP6NQC.js";
import "./chunk-VGMVF4GV.js";
import "./chunk-XEYMPJ7N.js";
import "./chunk-KO3UVZ5C.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-2DENZ2YJ.js";
import "./chunk-L7JT7IEU.js";
import "./chunk-Z6FQW4GV.js";
import "./chunk-R3PQRLXG.js";
import "./chunk-EE4OUDBR.js";
import "./chunk-QOCLY5FU.js";
import "./chunk-LPMJ77BS.js";
import "./chunk-3TJU2SRS.js";
import "./chunk-DQ7OVFPD.js";
import "./chunk-S3HJC2QH.js";
import "./chunk-EOFW2REK.js";
import "./chunk-2W7IWYRB.js";
import "./chunk-6JKL5S67.js";
import "./chunk-YU7TWVZR.js";
import "./chunk-CJQY3ECR.js";
import "./chunk-26L2P5NN.js";
import "./chunk-W7ENOTKE.js";
import "./chunk-EUPQSN2U.js";
import "./chunk-XNMGRNEU.js";
import "./chunk-6WM4KJML.js";
import "./chunk-N2Y53VC3.js";
import "./chunk-3T6W7NID.js";
import "./chunk-WDMUDEB6.js";

// node_modules/@angular/material/fesm2022/select.mjs
var matSelectAnimations = {
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [
      {
        type: 0,
        name: "void",
        styles: {
          type: 6,
          styles: { opacity: 0, transform: "scale(1, 0.8)" },
          offset: null
        }
      },
      {
        type: 1,
        expr: "void => showing",
        animation: {
          type: 4,
          styles: {
            type: 6,
            styles: { opacity: 1, transform: "scale(1, 1)" },
            offset: null
          },
          timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
        },
        options: null
      },
      {
        type: 1,
        expr: "* => void",
        animation: {
          type: 4,
          styles: { type: 6, styles: { opacity: 0 }, offset: null },
          timings: "100ms linear"
        },
        options: null
      }
    ],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
