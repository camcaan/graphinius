"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uuid = require("uuid");
var v4 = uuid.v4;
var SimplePerturber = (function () {
    function SimplePerturber(_graph) {
        this._graph = _graph;
    }
    SimplePerturber.prototype.deleteNodesPercentage = function (percentage) {
        if (percentage < 0) {
            throw new Error('Cowardly refusing to remove a negative amount of nodes');
        }
        if (percentage > 100) {
            percentage = 100;
        }
        var nr_nodes_to_delete = Math.ceil(this._graph.nrNodes() * percentage / 100);
        this.deleteNodesAmount(nr_nodes_to_delete);
    };
    SimplePerturber.prototype.deleteUndEdgesPercentage = function (percentage) {
        if (percentage > 100) {
            percentage = 100;
        }
        var nr_edges_to_delete = Math.ceil(this._graph.nrUndEdges() * percentage / 100);
        this.deleteUndEdgesAmount(nr_edges_to_delete);
    };
    SimplePerturber.prototype.deleteDirEdgesPercentage = function (percentage) {
        if (percentage > 100) {
            percentage = 100;
        }
        var nr_edges_to_delete = Math.ceil(this._graph.nrDirEdges() * percentage / 100);
        this.deleteDirEdgesAmount(nr_edges_to_delete);
    };
    SimplePerturber.prototype.deleteNodesAmount = function (amount) {
        if (amount < 0) {
            throw 'Cowardly refusing to remove a negative amount of nodes';
        }
        if (this._graph.nrNodes() === 0) {
            return;
        }
        for (var nodeID = 0, randomNodes = this._graph.pickRandomProperties(this._graph.getNodes(), amount); nodeID < randomNodes.length; nodeID++) {
            this._graph.deleteNode(this._graph.getNodes()[randomNodes[nodeID]]);
        }
    };
    SimplePerturber.prototype.deleteUndEdgesAmount = function (amount) {
        if (amount < 0) {
            throw 'Cowardly refusing to remove a negative amount of edges';
        }
        if (this._graph.nrUndEdges() === 0) {
            return;
        }
        for (var edgeID = 0, randomEdges = this._graph.pickRandomProperties(this._graph.getUndEdges(), amount); edgeID < randomEdges.length; edgeID++) {
            this._graph.deleteEdge(this._graph.getUndEdges()[randomEdges[edgeID]]);
        }
    };
    SimplePerturber.prototype.deleteDirEdgesAmount = function (amount) {
        if (amount < 0) {
            throw 'Cowardly refusing to remove a negative amount of edges';
        }
        if (this._graph.nrDirEdges() === 0) {
            return;
        }
        for (var edgeID = 0, randomEdges = this._graph.pickRandomProperties(this._graph.getDirEdges(), amount); edgeID < randomEdges.length; edgeID++) {
            this._graph.deleteEdge(this._graph.getDirEdges()[randomEdges[edgeID]]);
        }
    };
    SimplePerturber.prototype.addUndEdgesPercentage = function (percentage) {
        var nr_und_edges_to_add = Math.ceil(this._graph.nrUndEdges() * percentage / 100);
        this.addEdgesAmount(nr_und_edges_to_add, { directed: false });
    };
    SimplePerturber.prototype.addDirEdgesPercentage = function (percentage) {
        var nr_dir_edges_to_add = Math.ceil(this._graph.nrDirEdges() * percentage / 100);
        this.addEdgesAmount(nr_dir_edges_to_add, { directed: true });
    };
    SimplePerturber.prototype.addEdgesAmount = function (amount, config) {
        if (amount <= 0) {
            throw new Error('Cowardly refusing to add a non-positive amount of edges');
        }
        var node_a, node_b, nodes;
        var direction = (config && config.directed) ? config.directed : false, dir = direction ? "_d" : "_u";
        while (amount > 0) {
            node_a = this._graph.getRandomNode();
            while ((node_b = this._graph.getRandomNode()) === node_a) { }
            var edge_id = node_a.getID() + "_" + node_b.getID() + dir;
            if (node_a.hasEdgeID(edge_id)) {
                continue;
            }
            else {
                this._graph.addEdgeByID(edge_id, node_a, node_b, { directed: direction });
                --amount;
            }
        }
    };
    SimplePerturber.prototype.addNodesPercentage = function (percentage, config) {
        if (percentage < 0) {
            throw 'Cowardly refusing to add a negative amount of nodes';
        }
        var nr_nodes_to_add = Math.ceil(this._graph.nrNodes() * percentage / 100);
        this.addNodesAmount(nr_nodes_to_add, config);
    };
    SimplePerturber.prototype.addNodesAmount = function (amount, config) {
        if (amount < 0) {
            throw 'Cowardly refusing to add a negative amount of nodes';
        }
        var new_nodes = {};
        while (--amount >= 0) {
            var new_node_id = v4();
            new_nodes[new_node_id] = this._graph.addNodeByID(new_node_id);
        }
        if (config == null) {
            return;
        }
        else {
            this.createEdgesByConfig(config, new_nodes);
        }
    };
    SimplePerturber.prototype.createEdgesByConfig = function (config, new_nodes) {
        var degree, min_degree, max_degree, deg_probability;
        if (config.und_degree != null ||
            config.dir_degree != null ||
            config.min_und_degree != null && config.max_und_degree != null ||
            config.min_dir_degree != null && config.max_dir_degree != null) {
            if ((degree = config.und_degree) != null) {
                this.createEdgesSpan(degree, degree, false, new_nodes);
            }
            else if ((min_degree = config.min_und_degree) != null
                && (max_degree = config.max_und_degree) != null) {
                this.createEdgesSpan(min_degree, max_degree, false, new_nodes);
            }
            if (degree = config.dir_degree) {
                this.createEdgesSpan(degree, degree, true, new_nodes);
            }
            else if ((min_degree = config.min_dir_degree) != null
                && (max_degree = config.max_dir_degree) != null) {
                this.createEdgesSpan(min_degree, max_degree, true, new_nodes);
            }
        }
        else {
            if (config.probability_dir != null) {
                this.createEdgesProb(config.probability_dir, true, new_nodes);
            }
            if (config.probability_und != null) {
                this.createEdgesProb(config.probability_und, false, new_nodes);
            }
        }
    };
    SimplePerturber.prototype.createEdgesProb = function (probability, directed, new_nodes) {
        if (0 > probability || 1 < probability) {
            throw new Error("Probability out of range.");
        }
        directed = directed || false;
        new_nodes = new_nodes || this._graph.getNodes();
        var all_nodes = this._graph.getNodes(), node_a, node_b, edge_id, dir = directed ? '_d' : '_u';
        for (node_a in new_nodes) {
            for (node_b in all_nodes) {
                if (node_a !== node_b && Math.random() <= probability) {
                    edge_id = all_nodes[node_a].getID() + "_" + all_nodes[node_b].getID() + dir;
                    this._graph.addEdgeByID(edge_id, all_nodes[node_a], all_nodes[node_b], { directed: directed });
                }
            }
        }
    };
    SimplePerturber.prototype.createEdgesSpan = function (min, max, directed, setOfNodes) {
        if (min < 0) {
            throw new Error('Minimum degree cannot be negative.');
        }
        if (max >= this._graph.nrNodes()) {
            throw new Error('Maximum degree exceeds number of reachable nodes.');
        }
        if (min > max) {
            throw new Error('Minimum degree cannot exceed maximum degree.');
        }
        directed = directed || false;
        var min = min | 0, max = max | 0, new_nodes = setOfNodes || this._graph.getNodes(), all_nodes = this._graph.getNodes(), idx_a, node_a, node_b, edge_id, node_keys = Object.keys(all_nodes), keys_len = node_keys.length, rand_idx, rand_deg, dir = directed ? '_d' : '_u';
        for (idx_a in new_nodes) {
            node_a = new_nodes[idx_a];
            rand_idx = 0;
            rand_deg = (Math.random() * (max - min) + min) | 0;
            while (rand_deg) {
                rand_idx = (keys_len * Math.random()) | 0;
                node_b = all_nodes[node_keys[rand_idx]];
                if (node_a !== node_b) {
                    edge_id = node_a.getID() + "_" + node_b.getID() + dir;
                    if (node_a.hasEdgeID(edge_id)) {
                        continue;
                    }
                    this._graph.addEdgeByID(edge_id, node_a, node_b, { directed: directed });
                    --rand_deg;
                }
            }
        }
    };
    return SimplePerturber;
}());
exports.SimplePerturber = SimplePerturber;
