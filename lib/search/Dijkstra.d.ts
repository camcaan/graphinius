import * as $N from '../core/base/BaseNode';
import * as $G from '../core/base/BaseGraph';
import * as $PFS from '../search/PFS';
declare function Dijkstra(graph: $G.IGraph, source: $N.IBaseNode, target?: $N.IBaseNode): {
    [id: string]: $PFS.PFS_ResultEntry;
};
export { Dijkstra };
