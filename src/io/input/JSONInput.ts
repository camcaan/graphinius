import * as fs from 'fs';
import { IBaseEdge } from '../../core/base/BaseEdge';
import { IGraph, BaseGraph } from '../../core/base/BaseGraph';
import * as $R from '../../utils/RemoteUtils';
import { labelKeys } from '../interfaces';
import { PotentialEdgeInfo} from '../common/Dupes';
import * as uuid from 'uuid'
const v4 = uuid.v4;

import { Logger } from '../../utils/Logger';
import {BaseNode} from "../../core/base/BaseNode";
const logger = new Logger();


const DEFAULT_WEIGHT: number = 1;


export interface JSONEdge {
	to				: string;
	directed?	: string;
	weight?		: string;
	type?			: string;
}


export interface JSONNode {
	edges			: Array<JSONEdge>;
	coords?		: { [key: string]: Number };
	features?	: { [key: string]: any };
}


export interface JSONGraph {
	name		: string;
	nodes		: number;
	edges		: number;
	data		: { [key: string]: JSONNode }
}


export interface IJSONInConfig {
	explicit_direction?		: boolean;
	directed?							: boolean;
	weighted?							: boolean;
	typed?								:	boolean;
}


export interface IJSONInput {
	_config: IJSONInConfig;

	readFromJSONFile(file: string, graph?: IGraph): IGraph;
	readFromJSON(json: {}, graph?: IGraph): IGraph;
	readFromJSONURL(config: $R.RequestConfig, cb: Function, graph?: IGraph): void;
}


class JSONInput implements IJSONInput {
	_config: IJSONInConfig;	

	constructor(config?: IJSONInConfig) {
		this._config = config || {
			explicit_direction: config && config.explicit_direction || true,
			directed: config && config.directed || false,
			weighted: config && config.weighted || false
		};
	}

	readFromJSONFile(filepath: string, graph?: IGraph): IGraph {
		$R.checkNodeEnvironment();

		// TODO test for existing file...
		let json = JSON.parse(fs.readFileSync(filepath).toString());
		return this.readFromJSON(json, graph);
	}

	readFromJSONURL(config: $R.RequestConfig, cb: Function, graph?: IGraph): void {
		const self = this;

		// Assert we are in Node.js environment
		$R.checkNodeEnvironment();

		// Node.js
		$R.retrieveRemoteFile(config, function (raw_graph) {
			graph = self.readFromJSON(JSON.parse(raw_graph), graph);
			cb(graph, undefined);
		});
	}

	/**
	 * @todo split procedure into 2 parts: node & edge creation
	 * 			 creating nodes just by ID on the fly and 'filling them in'
	 * 			 later doesn't properly work with TypedGraphs, which
	 * 			 immediately need a valid node / edge label !
	 *
	 * @todo take order of node instantiation into account
	 * 			 -> this affects the ARRAY version of several algorithms...
	 */
	readFromJSON(json: JSONGraph, graph?: IGraph): IGraph {
		graph = graph || new BaseGraph(json.name);
		const typedGraph = BaseGraph.isTyped(graph);

		let
			coords_json: { [key: string]: any },
			coords: { [key: string]: Number },
			coord_idx: string,
			features: { [key: string]: any };

		for (let node_id in json.data) {
			const type = typedGraph ? json.data[node_id][labelKeys.n_type] : null;
			const label = json.data[node_id][labelKeys.n_label];
			const node = graph.addNodeByID(node_id, {label, type});
			// Here we set the reference...?
			features = json.data[node_id][labelKeys.n_features];
			if ( features ) {
				node.setFeatures(features);
			}
			// Here we copy...?
			coords_json = json.data[node_id][labelKeys.coords];
			if ( coords_json ) {
				coords = {};
				for (coord_idx in coords_json) {
					coords[coord_idx] = +coords_json[coord_idx];
				}
				node.setFeature(labelKeys.coords, coords);
			}
		}



		/**
		 * ROUND 2 - Add edges if no dupes
		 */
		for (let node_id in json.data) {
			let node = graph.getNodeById(node_id);

			// Reading and instantiating edges
			let edges = json.data[node_id][labelKeys.edges];
			for (let e in edges) {
				let edge_input = edges[e],
					edge_label = edge_input[labelKeys.e_label],
					edge_type = edge_input[labelKeys.e_type],
					target_node_id = edge_input[labelKeys.e_to],

					// Is there any direction information?            
					directed = this._config.explicit_direction ? !!edge_input[labelKeys.e_dir] : this._config.directed,
					dir_char = directed ? 'd' : 'u',

					// Is there any weight information?,
					/**
					 * @todo reverse this
					 */
					weight_float = JSONInput.handleEdgeWeights(edge_input),
					weight_info = weight_float === weight_float ? weight_float : DEFAULT_WEIGHT,
					edge_weight = this._config.weighted ? weight_info : undefined,
					target_node = graph.hasNodeID(target_node_id) ? graph.getNodeById(target_node_id) : graph.addNodeByID(target_node_id);


				/* --------------------------------------------------- */
				/*							DUPLICATE EDGE HANDLING								 */
				/* --------------------------------------------------- */
				/**
				 * @todo we can NOT check for duplicates by ID anymore,
				 * 			 since 1) IDs will be uuid's henceforth &
				 * 			 2) A_B_u will not be sufficiently unique anyways
				 * 			 (since type and weight would have to be added)
				 * 			 3) even if we systematically build such a
				 * 			 uniquely identifiable ID in JSONInput, a user
				 * 			 of our library might manually assign completely
				 * 			 different IDs which do not conform to this schema.
				 */
				let edge_id = node_id + "_" + target_node_id + "_" + dir_char,
					edge_id_u2 = target_node_id + "_" + node_id + "_" + dir_char;
				// logger.log(`Edge ID: ${edge_id}, edge ID 2: ${edge_id_u2} `)


				/**
				 * The completely same edge should only be added once...
				 *
				 * @todo generate uuid - make this obsolete !!!
				 */
				if (graph.hasEdgeID(edge_id)) {
					continue;
				}

				/**
				 * However, we allow multiple un/directed edges between same nodes
				 * even in case of same weight, as long as they have different types
				 *
				 * @todo carefully re-design after drawing a proper decision tree
				 * @todo also re-design BaseGraph & BaseNode classes if necessary
				 */
				let edge2 : IBaseEdge = null;

				if ( graph.hasEdgeID(edge_id_u2) ) {
					edge2 = graph.getEdgeById(edge_id_u2);
					// distinctLabel = edge2.getID() !== edge2.getLabel();
				}
				if ( !directed && edge2 ) {
					if ( this._config.weighted ) {
						if ( edge_weight != edge2.getWeight() ) {
							throw new Error('Input JSON flawed! Found duplicate UNdirected edge of different weights!');
						}
					}
				}
				else {
					const edge = graph.addEdgeByID(edge_id, node, target_node, {
						label: edge_label,
						directed: directed,
						weighted: this._config.weighted,
						weight: edge_weight,
						typed: true,
						type: edge_type
					});
					if ( edge_label ) {
						edge.setLabel(edge_label);
					}
				}
			}
		}
		return graph;
	}


	/**
	 * Infinity & -Infinity cases are redundant, as JavaScript 
	 * handles them correctly anyways (for now)
	 * @param edge_input 
	 */
	static handleEdgeWeights(edge_input): number {
		switch (edge_input[labelKeys.e_weight]) {
			case "undefined":
				return DEFAULT_WEIGHT;
			case "Infinity":
				return Number.POSITIVE_INFINITY;
			case "-Infinity":
				return Number.NEGATIVE_INFINITY;
			case "MAX":
				return Number.MAX_VALUE;
			case "MIN":
				return Number.MIN_VALUE;
			default:
				return parseFloat(edge_input[labelKeys.e_weight])
		}
	}
}

export { JSONInput }
