"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// check this out: https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
/*
TYPES FOR VERSION INFERENCE
 */
// export type InferHappnVersion<T> = T extends {
//   happn: infer A;
//   happnCluster?: never;
//   happner?: never;
//   happnerCluster?: never;
// }
//   ? A
//   : null;
//
// type InferHappnClusterVersion<T> = T extends {
//   happn: string;
//   happnCluster: infer A;
//   happner?: never;
//   happnerCluster?: never;
// }
//   ? A
//   : null;
//
// type InferHappnerVersion<T> = T extends {
//   happn: string;
//   happnCluster?: never;
//   happner: infer A;
//   happnerCluster?: never;
// }
//   ? A
//   : null;
//
// type InferHappnerClusterVersion<T> = T extends {
//   happn: string;
//   happnCluster: string;
//   happner: string;
//   happnerCluster: infer A;
// }
//   ? A
//   : null;
// type HappnVersion = InferHappnVersion<{ happn: '1.0.0' }>;
// type HappnClusterVersion = InferHappnClusterVersion<{ happn: '1.0.0'; happnCluster: '2.0.1' }>;
// type HappnerVersion = InferHappnerVersion<{ happn: '1.0.0'; happner: '3.0.1' }>;
// type HappnerClusterVersion = InferHappnerClusterVersion<{
//   happn: '1.0.0';
//   happnCluster: '1.2.3';
//   happner: '3.0.1';
//   happnerCluster: '3.2.1';
// }>;
