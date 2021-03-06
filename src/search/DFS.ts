import {GraphMode, GraphStats, MinAdjacencyListDict} from '../core/interfaces';
import * as $N from '../core/base/BaseNode';
import * as $G from '../core/base/BaseGraph';
import * as $CB from '../utils/CallbackUtils';


export interface DFS_Config {
  visit_result: {};
  callbacks: DFS_Callbacks;
  dir_mode: GraphMode;
  dfs_visit_marked: {[id: string] : boolean};
  messages?: {};
  filters?: any;
}

export interface DFS_Callbacks {
	init_dfs?			    : Array<Function>;
	init_dfs_visit?		: Array<Function>;
	node_popped?	 		: Array<Function>;
	node_marked?			: Array<Function>;
	node_unmarked?		: Array<Function>;
	adj_nodes_pushed?	: Array<Function>;
	sort_nodes?				: Function;
}

export interface StackEntry {
	node		: $N.IBaseNode;
	parent	: $N.IBaseNode;
  weight? : number;
}

export interface DFSVisit_Scope {
	stack 				: Array<StackEntry>;
	adj_nodes			: Array<$N.NeighborEntry>;
	stack_entry 	: StackEntry;
	current				: $N.IBaseNode;
	current_root	: $N.IBaseNode;
}

export interface DFS_Scope {
	marked 	  : {[id: string] : boolean};
	nodes		  : {[id: string] : $N.IBaseNode};
}


/**
 * DFS Visit - one run to see what nodes are reachable
 * from a given "current" root node
 *
 * @param graph
 * @param current_root
 * @param config
 * @returns {{}}
 * @constructor
 */
function DFSVisit(graph 				: $G.IGraph,
									current_root 	: $N.IBaseNode,
                  config?       : DFS_Config) {

	// scope to pass to callbacks at different stages of execution
	let dfsVisitScope : DFSVisit_Scope = {
		stack					: [],
		adj_nodes			: [],
		stack_entry		: null,
		current				: null,
		current_root	: current_root
	};
  
  config = config || prepareDFSVisitStandardConfig();
  let callbacks = config.callbacks,
      dir_mode = config.dir_mode;

	/**
	 * We are not traversing an empty graph...
	 */
	if ( graph.getMode() === GraphMode.INIT ) {
		throw new Error('Cowardly refusing to traverse graph without edges.');
	}
  /**
	 * We are not traversing a graph taking NO edges into account
	 */
	if ( dir_mode === GraphMode.INIT ) {
		throw new Error('Cannot traverse a graph with dir_mode set to INIT.');
	}

	/**
	 * HOOK 1 - INIT (INNER DFS VISIT):
	 * Initializing a possible result object,
	 * possibly with the current_root;
	 */
	if ( callbacks.init_dfs_visit ) {
		$CB.execCallbacks(callbacks.init_dfs_visit, dfsVisitScope);
	}

	// Start by pushing current root to the stack
	dfsVisitScope.stack.push({
		node		: current_root,
		parent	: current_root,
    weight  : 0 // initial weight cost from current_root
	});


	while ( dfsVisitScope.stack.length ) {
		dfsVisitScope.stack_entry = dfsVisitScope.stack.pop();
		dfsVisitScope.current = dfsVisitScope.stack_entry.node;
    
		/**
		 * HOOK 2 - AQUIRED CURRENT NODE / POPPED NODE
		 */
		if ( callbacks.node_popped ) {
			$CB.execCallbacks(callbacks.node_popped, dfsVisitScope);
		}

		if ( !config.dfs_visit_marked[dfsVisitScope.current.getID()] ) {
			config.dfs_visit_marked[dfsVisitScope.current.getID()] = true;

			/**
			 * HOOK 3 - CURRENT NODE UNMARKED
			 */
			if ( callbacks.node_unmarked ) {
				$CB.execCallbacks(callbacks.node_unmarked, dfsVisitScope);
			}

			/**
			 * Do we move only in the directed subgraph,
			 * undirected subgraph or complete (mixed) graph?
			 */
			if ( dir_mode === GraphMode.MIXED ) {
				dfsVisitScope.adj_nodes = dfsVisitScope.current.reachNodes();
			}
			else if ( dir_mode === GraphMode.UNDIRECTED ) {
				dfsVisitScope.adj_nodes = dfsVisitScope.current.connNodes();
			}
			else if ( dir_mode === GraphMode.DIRECTED ) {
				dfsVisitScope.adj_nodes = dfsVisitScope.current.nextNodes();
			}

			/**
			 * HOOK 4 - SORT ADJACENT NODES
			 */
			if ( typeof callbacks.sort_nodes === 'function' ) {
				callbacks.sort_nodes(dfsVisitScope);
			}

			for ( let adj_idx in dfsVisitScope.adj_nodes ) {
				/**
				 * HOOK 5 - NODE OR EDGE TYPE CHECK...
				 * LATER !!
				 */
        if ( callbacks ) {
        }
        
        
				dfsVisitScope.stack.push({
					node: dfsVisitScope.adj_nodes[adj_idx].node,
					parent: dfsVisitScope.current,
          weight: dfsVisitScope.adj_nodes[adj_idx].edge.getWeight()
				});
			}

			/**
			 * HOOK 6 - ADJACENT NODES PUSHED - LEAVING CURRENT NODE
			 */
			if ( callbacks.adj_nodes_pushed ) {
				$CB.execCallbacks(callbacks.adj_nodes_pushed, dfsVisitScope);
			}

		}
		else {
			/**
			 * HOOK 7 - CURRENT NODE ALREADY MARKED
			 */
			if ( callbacks.node_marked ) {
				$CB.execCallbacks(callbacks.node_marked, dfsVisitScope);
			}
		}
	}

  return config.visit_result;


}
/**
 * Depth first search - used for reachability / exploration
 * of graph structure and as a basis for topological sorting
 * and component / community analysis.
 * Because DFS can be used as a basis for many other algorithms,
 * we want to keep the result as generic as possible to be
 * populated by the caller rather than the core DFS algorithm.
 *
 * @param graph
 * @param root
 * @param config
 * @returns {{}[]}
 * @constructor
 */
function DFS( graph 		  : $G.IGraph,
							root      	: $N.IBaseNode,
							config?	    : DFS_Config) {
                
  config = config || prepareDFSStandardConfig();
  let callbacks = config.callbacks,
      dir_mode = config.dir_mode;
      
	if ( graph.getMode() === GraphMode.INIT ) {
		throw new Error('Cowardly refusing to traverse graph without edges.');
	}
	if ( dir_mode === GraphMode.INIT ) {
		throw new Error('Cannot traverse a graph with dir_mode set to INIT.');
	}
  
	let dfsScope : DFS_Scope = {
      marked 	  : {},
      nodes 	  : graph.getNodes()
  };

	/**
	 * HOOK 1 - INIT (OUTER DFS)
	 */
	if ( callbacks.init_dfs ) {
		$CB.execCallbacks(callbacks.init_dfs, dfsScope);
	}

	callbacks.adj_nodes_pushed = callbacks.adj_nodes_pushed || [];
	let markNode = function ( context : DFSVisit_Scope ) {
		dfsScope.marked[context.current.getID()] = true;
	};
	callbacks.adj_nodes_pushed.push(markNode);
  
  
  // We need to put our results into segments
  // for easy counting of 'components'
  // TODO refactor for count & counter...
  let dfs_result = [{}];
  let dfs_idx = 0;
  let count = 0;
	let counter = function() {
		return count++;
	};
  
  /**
   * We not only add new nodes to the result object
   * of DFSVisit, but also to it's appropriate
   * segment of the dfs_result object
   */
  let addToProperSegment = function( context: DFSVisit_Scope ) {
    dfs_result[dfs_idx][context.current.getID()] = {
			parent 	: context.stack_entry.parent,
			counter : counter()
		};
  };
  
  // check if a callbacks object has been instantiated
  if ( callbacks && callbacks.node_unmarked ) {
    callbacks.node_unmarked.push(addToProperSegment);
  }
  
  // Start with root node, no matter what
  DFSVisit(graph, root, config);

  // Now take the rest in 'normal' order
	for( let node_key in dfsScope.nodes ) {
    if ( !dfsScope.marked[node_key] ) {
      // Next segment in dfs_results
      dfs_idx++;
      dfs_result.push({});
      // Explore and fill next subsegment
      DFSVisit(graph, dfsScope.nodes[node_key], config);
    }
	}
  
  // console.dir(config.visit_result);
  return dfs_result;
}


/**
 * This is the only place in which a config object
 * is instantiated (except manually, of course)
 * 
 * Therefore, we do not take any arguments
 */
function prepareDFSVisitStandardConfig() {

  let config : DFS_Config = {
    visit_result: {},
    callbacks: {},
    messages: {},
    dfs_visit_marked: {},
    dir_mode: GraphMode.MIXED
  },
  result = config.visit_result,
  callbacks = config.callbacks;
              
  // internal letiable for order of visit
  // during DFS Visit                      
  let count = 0;
	let counter = function() {
		return count++;
	};
  
	callbacks.init_dfs_visit = callbacks.init_dfs_visit || [];
	let initDFSVisit = function( context : DFSVisit_Scope ) {
		result[context.current_root.getID()] = {
			parent 	: context.current_root
		};
	};
	callbacks.init_dfs_visit.push(initDFSVisit);
  
	callbacks.node_unmarked = callbacks.node_unmarked || [];
	let setResultEntry = function( context : DFSVisit_Scope ) {
		result[context.current.getID()] = {
			parent 	: context.stack_entry.parent,
			counter : counter()
		};
	};
	callbacks.node_unmarked.push(setResultEntry);
  
  return config;
}


/**
 * First instantiates config file for DFSVisit, then
 * enhances it with outer DFS init callback
 */
function prepareDFSStandardConfig() {                                
	// First prepare DFS Visit callbacks
	let config = prepareDFSVisitStandardConfig(),
      callbacks = config.callbacks;
      // result = config.visit_result;
  
	// Now add outer DFS INIT callback
	callbacks.init_dfs = callbacks.init_dfs || [];
	let setInitialResultEntries = function( context : DFS_Scope ) {
		// for ( let node_id in context.nodes ) {
		// 	result[node_id] = {
		// 		parent: null,
		// 		counter: -1
		// 	}
		// }
	};
	callbacks.init_dfs.push(setInitialResultEntries);

  return config;
}

export { DFSVisit, 
         DFS,
         prepareDFSVisitStandardConfig,
         prepareDFSStandardConfig
       };
