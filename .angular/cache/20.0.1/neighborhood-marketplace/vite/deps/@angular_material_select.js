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
} from "./chunk-QAXU4LT6.js";
import "./chunk-DKXEKCRU.js";
import "./chunk-IEM6WEMP.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-WGPBF5QG.js";
import "./chunk-F4ZNG5VE.js";
import "./chunk-DBQ6455J.js";
import "./chunk-SW4PHGQ4.js";
import "./chunk-MWOLC6HJ.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-UUOVEVA5.js";
import "./chunk-E7YVOAHY.js";
import "./chunk-ISWNRYK3.js";
import "./chunk-ZNV3XPWF.js";
import "./chunk-5ULMWDCF.js";
import "./chunk-AOLGRO6Q.js";
import "./chunk-CN4C2NBK.js";
import "./chunk-KFEJVN6P.js";
import "./chunk-DQ7OVFPD.js";
import "./chunk-SSHI4TI4.js";
import "./chunk-EOFW2REK.js";
import "./chunk-K7QKZQK6.js";
import "./chunk-UJ6WFDUK.js";
import "./chunk-3OYKSXHN.js";
import "./chunk-DE3MY7RS.js";
import "./chunk-W7ENOTKE.js";
import "./chunk-2QVOP24D.js";
import "./chunk-3KKC7HMJ.js";
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
