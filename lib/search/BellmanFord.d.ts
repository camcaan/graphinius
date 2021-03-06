import * as $G from '../core/base/BaseGraph';
import * as $N from '../core/base/BaseNode';
export interface BFArrrayResult {
    distances: Array<number>;
    neg_cycle: boolean;
}
export interface BFDictResult {
    distances: {};
    neg_cycle: boolean;
}
declare function BellmanFordArray(graph: $G.IGraph, start: $N.IBaseNode): BFArrrayResult;
declare function BellmanFordDict(graph: $G.IGraph, start: $N.IBaseNode): BFDictResult;
export { BellmanFordDict, BellmanFordArray };
