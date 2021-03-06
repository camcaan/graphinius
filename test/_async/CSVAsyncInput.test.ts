import {GraphMode, GraphStats} from '../../src/core/interfaces';
import * as $N from '../../src/core/base/BaseNode';
import * as $E from '../../src/core/base/BaseEdge';
import * as $G from '../../src/core/base/BaseGraph';
import { CSVInput, ICSVInConfig } from '../../src/io/input/CSVInput';
import * as $C from '../io/input/common';
import * as $R from '../../src/utils/RemoteUtils';

import { Logger } from '../../src/utils/Logger';
const logger = new Logger();

const REMOTE_HOST = "raw.githubusercontent.com";
const REMOTE_PATH = "/cassinius/graphinius-demo/master/test_data/csv/";
const CSV_EXTENSION = ".csv";

const REAL_GRAPH_NR_NODES = 5937,
	  REAL_GRAPH_NR_EDGES = 17777;


describe("ASYNC CSV GRAPH INPUT TESTS - ", () => {

	let csv: CSVInput,
		sep: string,
		input_file: string,
		graph: $G.IGraph,
		stats: GraphStats,
		DEFAULT_SEP: string = ',',
		config: $R.RequestConfig;

	beforeEach(() => {
		config = {
			remote_host: REMOTE_HOST,
			remote_path: REMOTE_PATH,
			file_name: undefined
		};
	});


	describe('Small test graphs from CSV', () => {

		/**
		 * REMOTE test
		 * The CSV will be encoded as an adjacency list
		 */
		test(
			'should construct a very small graph from a REMOTELY FETCHED adjacency list and produce the right stats',
			(done) => {
				csv = new CSVInput();
				config.file_name = "small_graph_adj_list_def_sep" + CSV_EXTENSION;
				csv.readFromAdjacencyListURL(config, function (graph, err) {
					$C.checkSmallGraphStats(graph);
					done();
				});
			}
		);


		/**
		 * REMOTE test
		 * The CSV will be encoded as an edge list
		 */
		test(
			'should construct a very small graph from a REMOTELY FETCHED edge list and produce the right stats',
			(done) => {
				config.file_name = "small_graph_edge_list" + CSV_EXTENSION;
				csv.readFromEdgeListURL(config, function (graph, err) {
					$C.checkSmallGraphStats(graph);
					done();
				});
			}
		);

	});


	describe('Real graph from CSV', () => {
		jest.setTimeout(60000);

		/**
		 * Remotely fetched edge list with a REAL sized graph, edges set to directed
		 * graph should have 5937 nodes.
		 */
		test(
			'should construct a real sized graph from a remote URL (edge list)',
			(done) => {
				csv._config.separator = " ";
				csv._config.explicit_direction = false;
				csv._config.direction_mode = true;
				config.file_name = "real_graph_edge_list_no_dir" + CSV_EXTENSION;
				csv.readFromEdgeListURL(config, function (graph, err) {
					logger.log(graph.stats);

					stats = graph.stats;
					expect(stats.nr_nodes).toBe(REAL_GRAPH_NR_NODES);
					expect(stats.nr_dir_edges).toBe(REAL_GRAPH_NR_EDGES);
					expect(stats.nr_und_edges).toBe(0);
					expect(stats.mode).toBe(GraphMode.DIRECTED);
					done();
				});
			});

	});

});
