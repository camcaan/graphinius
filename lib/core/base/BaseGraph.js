"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var interfaces_1 = require("../interfaces");
var BaseNode_1 = require("./BaseNode");
var BaseEdge_1 = require("./BaseEdge");
var BFS_1 = require("../../search/BFS");
var DFS_1 = require("../../search/DFS");
var BellmanFord_1 = require("../../search/BellmanFord");
var Johnsons_1 = require("../../search/Johnsons");
var DEFAULT_WEIGHT = 1;
var BaseGraph = (function () {
    function BaseGraph(_label) {
        this._label = _label;
        this._nr_nodes = 0;
        this._nr_dir_edges = 0;
        this._nr_und_edges = 0;
        this._mode = interfaces_1.GraphMode.INIT;
        this._nodes = {};
        this._dir_edges = {};
        this._und_edges = {};
    }
    BaseGraph.isTyped = function (arg) {
        return !!arg.type;
    };
    Object.defineProperty(BaseGraph.prototype, "label", {
        get: function () {
            return this._label;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseGraph.prototype, "mode", {
        get: function () {
            return this._mode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseGraph.prototype, "stats", {
        get: function () {
            return this.getStats();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseGraph.prototype, "inHist", {
        get: function () {
            return this.degreeHist(interfaces_1.DIR.in);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseGraph.prototype, "outHist", {
        get: function () {
            return this.degreeHist(interfaces_1.DIR.out);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseGraph.prototype, "connHist", {
        get: function () {
            return this.degreeHist(interfaces_1.DIR.und);
        },
        enumerable: true,
        configurable: true
    });
    BaseGraph.prototype.degreeHist = function (dir) {
        var result = [];
        for (var nid in this._nodes) {
            var node = this._nodes[nid];
            var deg = void 0;
            switch (dir) {
                case interfaces_1.DIR.in:
                    deg = node.in_deg;
                    break;
                case interfaces_1.DIR.out:
                    deg = node.out_deg;
                    break;
                default:
                    deg = node.deg;
            }
            if (!result[deg]) {
                result[deg] = new Set([node]);
            }
            else {
                result[deg].add(node);
            }
        }
        return result;
    };
    BaseGraph.prototype.reweighIfHasNegativeEdge = function (clone) {
        if (clone === void 0) { clone = false; }
        if (this.hasNegativeEdge()) {
            var result_graph = clone ? this.cloneStructure() : this;
            var extraNode = new BaseNode_1.BaseNode("extraNode");
            result_graph = Johnsons_1.addExtraNandE(result_graph, extraNode);
            var BFresult = BellmanFord_1.BellmanFordDict(result_graph, extraNode);
            if (BFresult.neg_cycle) {
                throw new Error("The graph contains a negative cycle, thus it can not be processed");
            }
            else {
                var newWeights = BFresult.distances;
                result_graph = Johnsons_1.reWeighGraph(result_graph, newWeights, extraNode);
                result_graph.deleteNode(extraNode);
            }
            return result_graph;
        }
    };
    BaseGraph.prototype.toDirectedGraph = function (copy) {
        if (copy === void 0) { copy = false; }
        var result_graph = copy ? this.cloneStructure() : this;
        if (this._nr_dir_edges === 0 && this._nr_und_edges === 0) {
            throw new Error("Cowardly refusing to re-interpret an empty graph.");
        }
        return result_graph;
    };
    BaseGraph.prototype.toUndirectedGraph = function () {
        return this;
    };
    BaseGraph.prototype.hasNegativeEdge = function () {
        var has_neg_edge = false, edge;
        for (var edge_id in this._und_edges) {
            edge = this._und_edges[edge_id];
            if (!edge.isWeighted()) {
                continue;
            }
            if (edge.getWeight() < 0) {
                return true;
            }
        }
        for (var edge_id in this._dir_edges) {
            edge = this._dir_edges[edge_id];
            if (!edge.isWeighted()) {
                continue;
            }
            if (edge.getWeight() < 0) {
                has_neg_edge = true;
                break;
            }
        }
        return has_neg_edge;
    };
    BaseGraph.prototype.hasNegativeCycles = function (node) {
        var _this = this;
        if (!this.hasNegativeEdge()) {
            return false;
        }
        var negative_cycle = false, start = node ? node : this.getRandomNode();
        DFS_1.DFS(this, start).forEach(function (comp) {
            var min_count = Number.POSITIVE_INFINITY, comp_start_node = "";
            Object.keys(comp).forEach(function (node_id) {
                if (min_count > comp[node_id].counter) {
                    min_count = comp[node_id].counter;
                    comp_start_node = node_id;
                }
            });
            if (BellmanFord_1.BellmanFordArray(_this, _this._nodes[comp_start_node]).neg_cycle) {
                negative_cycle = true;
            }
        });
        return negative_cycle;
    };
    BaseGraph.prototype.getMode = function () {
        return this._mode;
    };
    BaseGraph.prototype.getStats = function () {
        return {
            mode: this._mode,
            nr_nodes: this._nr_nodes,
            nr_und_edges: this._nr_und_edges,
            nr_dir_edges: this._nr_dir_edges,
            density_dir: this._nr_dir_edges / (this._nr_nodes * (this._nr_nodes - 1)),
            density_und: 2 * this._nr_und_edges / (this._nr_nodes * (this._nr_nodes - 1))
        };
    };
    BaseGraph.prototype.nrNodes = function () {
        return this._nr_nodes;
    };
    BaseGraph.prototype.nrDirEdges = function () {
        return this._nr_dir_edges;
    };
    BaseGraph.prototype.nrUndEdges = function () {
        return this._nr_und_edges;
    };
    BaseGraph.prototype.addNodeByID = function (id, opts) {
        if (this.hasNodeID(id)) {
            throw new Error("Won't add node with duplicate ID.");
        }
        var node = new BaseNode_1.BaseNode(id, opts);
        return this.addNode(node) ? node : null;
    };
    BaseGraph.prototype.addNode = function (node) {
        if (this.hasNodeID(node.getID())) {
            throw new Error("Won't add node with duplicate ID.");
        }
        this._nodes[node.getID()] = node;
        this._nr_nodes += 1;
        return node;
    };
    BaseGraph.prototype.hasNodeID = function (id) {
        return !!this._nodes[id];
    };
    BaseGraph.prototype.getNodeById = function (id) {
        return this._nodes[id];
    };
    BaseGraph.prototype.n = function (id) {
        return this.getNodeById(id);
    };
    BaseGraph.prototype.getNodes = function () {
        return this._nodes;
    };
    BaseGraph.prototype.getRandomNode = function () {
        return this.pickRandomProperty(this._nodes);
    };
    BaseGraph.prototype.deleteNode = function (node) {
        var rem_node = this._nodes[node.getID()];
        if (!rem_node) {
            throw new Error('Cannot remove a foreign node.');
        }
        var in_deg = node.in_deg;
        var out_deg = node.out_deg;
        var deg = node.deg;
        if (in_deg) {
            this.deleteInEdgesOf(node);
        }
        if (out_deg) {
            this.deleteOutEdgesOf(node);
        }
        if (deg) {
            this.deleteUndEdgesOf(node);
        }
        delete this._nodes[node.getID()];
        this._nr_nodes -= 1;
    };
    BaseGraph.prototype.hasEdgeID = function (id) {
        return !!this._dir_edges[id] || !!this._und_edges[id];
    };
    BaseGraph.prototype.getEdgeById = function (id) {
        var edge = this._dir_edges[id] || this._und_edges[id];
        if (!edge) {
            throw new Error("cannot retrieve edge with non-existing ID.");
        }
        return edge;
    };
    BaseGraph.checkExistanceOfEdgeNodes = function (node_a, node_b) {
        if (!node_a) {
            throw new Error("Cannot find edge. Node A does not exist (in graph).");
        }
        if (!node_b) {
            throw new Error("Cannot find edge. Node B does not exist (in graph).");
        }
    };
    BaseGraph.prototype.getDirEdgeByNodeIDs = function (node_a_id, node_b_id) {
        var node_a = this.getNodeById(node_a_id);
        var node_b = this.getNodeById(node_b_id);
        BaseGraph.checkExistanceOfEdgeNodes(node_a, node_b);
        var edges_dir = node_a.outEdges(), edges_dir_keys = Object.keys(edges_dir);
        for (var i = 0; i < edges_dir_keys.length; i++) {
            var edge = edges_dir[edges_dir_keys[i]];
            if (edge.getNodes().b.getID() == node_b_id) {
                return edge;
            }
        }
        throw new Error("Cannot find edge. There is no edge between Node " + node_a_id + " and " + node_b_id + ".");
    };
    BaseGraph.prototype.getUndEdgeByNodeIDs = function (node_a_id, node_b_id) {
        var node_a = this.getNodeById(node_a_id);
        var node_b = this.getNodeById(node_b_id);
        BaseGraph.checkExistanceOfEdgeNodes(node_a, node_b);
        var edges_und = node_a.undEdges(), edges_und_keys = Object.keys(edges_und);
        for (var i = 0; i < edges_und_keys.length; i++) {
            var edge = edges_und[edges_und_keys[i]];
            var b = void 0;
            (edge.getNodes().a.getID() == node_a_id) ? (b = edge.getNodes().b.getID()) : (b = edge.getNodes().a.getID());
            if (b == node_b_id) {
                return edge;
            }
        }
    };
    BaseGraph.prototype.getDirEdges = function () {
        return this._dir_edges;
    };
    BaseGraph.prototype.getUndEdges = function () {
        return this._und_edges;
    };
    BaseGraph.prototype.getDirEdgesArray = function () {
        var edges = [];
        for (var e_id in this._dir_edges) {
            edges.push(this._dir_edges[e_id]);
        }
        return edges;
    };
    BaseGraph.prototype.getUndEdgesArray = function () {
        var edges = [];
        for (var e_id in this._und_edges) {
            edges.push(this._und_edges[e_id]);
        }
        return edges;
    };
    BaseGraph.prototype.addEdgeByNodeIDs = function (label, node_a_id, node_b_id, opts) {
        var node_a = this.getNodeById(node_a_id), node_b = this.getNodeById(node_b_id);
        if (!node_a) {
            throw new Error("Cannot add edge. Node A does not exist");
        }
        else if (!node_b) {
            throw new Error("Cannot add edge. Node B does not exist");
        }
        else {
            return this.addEdgeByID(label, node_a, node_b, opts);
        }
    };
    BaseGraph.prototype.addEdgeByID = function (id, node_a, node_b, opts) {
        var edge = new BaseEdge_1.BaseEdge(id, node_a, node_b, opts || {});
        return this.addEdge(edge) ? edge : null;
    };
    BaseGraph.prototype.addEdge = function (edge) {
        var node_a = edge.getNodes().a, node_b = edge.getNodes().b;
        if (!this.hasNodeID(node_a.getID()) || !this.hasNodeID(node_b.getID())
            || this._nodes[node_a.getID()] !== node_a || this._nodes[node_b.getID()] !== node_b) {
            throw new Error("can only add edge between two nodes existing in graph");
        }
        node_a.addEdge(edge);
        if (edge.isDirected()) {
            node_b.addEdge(edge);
            this._dir_edges[edge.getID()] = edge;
            this._nr_dir_edges += 1;
            this.updateGraphMode();
        }
        else {
            if (node_a !== node_b) {
                node_b.addEdge(edge);
            }
            this._und_edges[edge.getID()] = edge;
            this._nr_und_edges += 1;
            this.updateGraphMode();
        }
        return edge;
    };
    BaseGraph.prototype.deleteEdge = function (edge) {
        var dir_edge = this._dir_edges[edge.getID()];
        var und_edge = this._und_edges[edge.getID()];
        if (!dir_edge && !und_edge) {
            throw new Error('cannot remove non-existing edge.');
        }
        var nodes = edge.getNodes();
        nodes.a.removeEdge(edge);
        if (nodes.a !== nodes.b) {
            nodes.b.removeEdge(edge);
        }
        if (dir_edge) {
            delete this._dir_edges[edge.getID()];
            this._nr_dir_edges -= 1;
        }
        else {
            delete this._und_edges[edge.getID()];
            this._nr_und_edges -= 1;
        }
        this.updateGraphMode();
    };
    BaseGraph.prototype.deleteInEdgesOf = function (node) {
        this.checkConnectedNodeOrThrow(node);
        var in_edges = node.inEdges();
        var key, edge;
        for (key in in_edges) {
            edge = in_edges[key];
            edge.getNodes().a.removeEdge(edge);
            delete this._dir_edges[edge.getID()];
            this._nr_dir_edges -= 1;
        }
        node.clearInEdges();
        this.updateGraphMode();
    };
    BaseGraph.prototype.deleteOutEdgesOf = function (node) {
        this.checkConnectedNodeOrThrow(node);
        var out_edges = node.outEdges();
        var key, edge;
        for (key in out_edges) {
            edge = out_edges[key];
            edge.getNodes().b.removeEdge(edge);
            delete this._dir_edges[edge.getID()];
            this._nr_dir_edges -= 1;
        }
        node.clearOutEdges();
        this.updateGraphMode();
    };
    BaseGraph.prototype.deleteDirEdgesOf = function (node) {
        this.deleteInEdgesOf(node);
        this.deleteOutEdgesOf(node);
    };
    BaseGraph.prototype.deleteUndEdgesOf = function (node) {
        this.checkConnectedNodeOrThrow(node);
        var und_edges = node.undEdges();
        var key, edge;
        for (key in und_edges) {
            edge = und_edges[key];
            var conns = edge.getNodes();
            conns.a.removeEdge(edge);
            if (conns.a !== conns.b) {
                conns.b.removeEdge(edge);
            }
            delete this._und_edges[edge.getID()];
            this._nr_und_edges -= 1;
        }
        node.clearUndEdges();
        this.updateGraphMode();
    };
    BaseGraph.prototype.deleteAllEdgesOf = function (node) {
        this.deleteDirEdgesOf(node);
        this.deleteUndEdgesOf(node);
    };
    BaseGraph.prototype.clearAllDirEdges = function () {
        for (var edge in this._dir_edges) {
            this.deleteEdge(this._dir_edges[edge]);
        }
    };
    BaseGraph.prototype.clearAllUndEdges = function () {
        for (var edge in this._und_edges) {
            this.deleteEdge(this._und_edges[edge]);
        }
    };
    BaseGraph.prototype.clearAllEdges = function () {
        this.clearAllDirEdges();
        this.clearAllUndEdges();
    };
    BaseGraph.prototype.getRandomDirEdge = function () {
        return this.pickRandomProperty(this._dir_edges);
    };
    BaseGraph.prototype.getRandomUndEdge = function () {
        return this.pickRandomProperty(this._und_edges);
    };
    BaseGraph.prototype.cloneStructure = function () {
        var new_graph = new BaseGraph(this._label), old_nodes = this.getNodes(), old_edge, new_node_a = null, new_node_b = null;
        for (var node_id in old_nodes) {
            new_graph.addNode(old_nodes[node_id].clone());
        }
        [this.getDirEdges(), this.getUndEdges()].forEach(function (old_edges) {
            for (var edge_id in old_edges) {
                old_edge = old_edges[edge_id];
                new_node_a = new_graph.getNodeById(old_edge.getNodes().a.getID());
                new_node_b = new_graph.getNodeById(old_edge.getNodes().b.getID());
                new_graph.addEdge(old_edge.clone(new_node_a, new_node_b));
            }
        });
        return new_graph;
    };
    BaseGraph.prototype.cloneSubGraphStructure = function (root, cutoff) {
        var new_graph = new BaseGraph(this._label);
        var config = BFS_1.prepareBFSStandardConfig();
        var bfsNodeUnmarkedTestCallback = function (context) {
            if (config.result[context.next_node.getID()].counter > cutoff) {
                context.queue = [];
            }
            else {
                new_graph.addNode(context.next_node.clone());
            }
        };
        config.callbacks.node_unmarked.push(bfsNodeUnmarkedTestCallback);
        BFS_1.BFS(this, root, config);
        var old_edge, new_node_a = null, new_node_b = null;
        [this.getDirEdges(), this.getUndEdges()].forEach(function (old_edges) {
            for (var edge_id in old_edges) {
                old_edge = old_edges[edge_id];
                new_node_a = new_graph.getNodeById(old_edge.getNodes().a.getID());
                new_node_b = new_graph.getNodeById(old_edge.getNodes().b.getID());
                if (new_node_a != null && new_node_b != null)
                    new_graph.addEdge(old_edge.clone(new_node_a, new_node_b));
            }
        });
        return new_graph;
    };
    BaseGraph.prototype.checkConnectedNodeOrThrow = function (node) {
        var inGraphNode = this._nodes[node.getID()];
        if (!inGraphNode) {
            throw new Error('Cowardly refusing to delete edges of a foreign node.');
        }
    };
    BaseGraph.prototype.updateGraphMode = function () {
        var nr_dir = this._nr_dir_edges, nr_und = this._nr_und_edges;
        if (nr_dir && nr_und) {
            this._mode = interfaces_1.GraphMode.MIXED;
        }
        else if (nr_dir) {
            this._mode = interfaces_1.GraphMode.DIRECTED;
        }
        else if (nr_und) {
            this._mode = interfaces_1.GraphMode.UNDIRECTED;
        }
        else {
            this._mode = interfaces_1.GraphMode.INIT;
        }
    };
    BaseGraph.prototype.pickRandomProperty = function (propList) {
        var tmpList = Object.keys(propList);
        var randomPropertyName = tmpList[Math.floor(Math.random() * tmpList.length)];
        return propList[randomPropertyName];
    };
    BaseGraph.prototype.pickRandomProperties = function (propList, amount) {
        var ids = [];
        var keys = Object.keys(propList);
        var fraction = amount / keys.length;
        var used_keys = {};
        for (var i = 0; ids.length < amount && i < keys.length; i++) {
            if (Math.random() < fraction) {
                ids.push(keys[i]);
                used_keys[keys[i]] = i;
            }
        }
        var diff = amount - ids.length;
        for (var i = 0; i < keys.length && diff; i++) {
            if (used_keys[keys[i]] == null) {
                ids.push(keys[i]);
                diff--;
            }
        }
        return ids;
    };
    return BaseGraph;
}());
exports.BaseGraph = BaseGraph;
