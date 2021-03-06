import * as $N from '../core/base/BaseNode';
import * as $G from '../core/base/BaseGraph';
declare function Johnsons(graph: $G.IGraph): {};
declare function addExtraNandE(target: $G.IGraph, nodeToAdd: $N.IBaseNode): $G.IGraph;
declare function reWeighGraph(target: $G.IGraph, distDict: {}, tempNode: $N.IBaseNode): $G.IGraph;
declare function PFSFromAllNodes(graph: $G.IGraph): {};
export { Johnsons, addExtraNandE, reWeighGraph, PFSFromAllNodes };
