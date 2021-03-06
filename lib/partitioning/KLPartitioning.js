"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var KCut_1 = require("./KCut");
var BinaryHeap_1 = require("../datastructs/BinaryHeap");
var Logger_1 = require("../utils/Logger");
var ComputeGraph_1 = require("../core/compute/ComputeGraph");
var logger = new Logger_1.Logger();
var DEFAULT_WEIGHT = 1;
var KLPartitioning = (function () {
    function KLPartitioning(_graph, config) {
        this._graph = _graph;
        this._config = config || {
            initShuffle: false,
            directed: false,
            weighted: false
        };
        this._bestPartitioning = 1;
        this._currentPartitioning = 1;
        this._partitionings = new Map();
        this._gainsHash = new Map();
        this._costs = {
            internal: {},
            external: {},
        };
        this._open_sets = {
            partition_a: new Map(),
            partition_b: new Map()
        };
        this._cg = new ComputeGraph_1.ComputeGraph(this._graph);
        this._adjList = this._cg.adjListW();
        this._keys = Object.keys(this._graph.getNodes());
        this.initPartitioning(this._config.initShuffle);
        var nr_parts = this._partitionings.get(this._currentPartitioning).partitions.size;
        if (nr_parts !== 2) {
            throw new Error("KL partitioning works on 2 initial partitions only, got " + nr_parts + ".");
        }
        this.initCosts();
        this.initGainsHeap();
    }
    KLPartitioning.prototype.initPartitioning = function (initShuffle) {
        var e_1, _a;
        var _this = this;
        if (initShuffle) {
            this._partitionings.set(this._currentPartitioning, new KCut_1.KCut(this._graph).cut(2, true));
            var part_it = this._partitionings.get(this._currentPartitioning).partitions.values();
            part_it.next().value.nodes.forEach(function (node) {
                _this._open_sets.partition_a.set(node.getID(), true);
            });
            part_it.next().value.nodes.forEach(function (node) {
                _this._open_sets.partition_b.set(node.getID(), true);
            });
        }
        else {
            var partitioning = {
                partitions: new Map(),
                nodePartMap: new Map(),
                cut_cost: 0
            };
            this._partitionings.set(this._currentPartitioning, partitioning);
            try {
                for (var _b = __values(this._keys), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var key = _c.value;
                    var node = this._graph.getNodeById(key);
                    var node_part = node.getFeature('partition');
                    if (node_part == null) {
                        throw new Error('no node feature "partition" encountered - you need to set initShuffle to true');
                    }
                    else {
                        partitioning.nodePartMap.set(key, node_part);
                        if (!partitioning.partitions.get(node_part)) {
                            partitioning.partitions.set(node_part, {
                                nodes: new Map()
                            });
                        }
                        partitioning.partitions.get(node_part).nodes.set(key, node);
                    }
                    if (node_part === 1) {
                        this._open_sets.partition_a.set(key, true);
                    }
                    else {
                        this._open_sets.partition_b.set(key, true);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    KLPartitioning.prototype.initCosts = function () {
        var e_2, _a;
        var _this = this;
        var partitioning = this._partitionings.get(this._currentPartitioning), nodePartMap = partitioning.nodePartMap;
        var _loop_1 = function (source) {
            this_1._costs.external[source] = 0;
            this_1._costs.internal[source] = 0;
            Object.keys(this_1._adjList[source]).forEach(function (target) {
                logger.write("[" + nodePartMap.get(source) + ", " + nodePartMap.get(target) + "]");
                var edge_weight = _this._config.weighted ? _this._adjList[source][target] : DEFAULT_WEIGHT;
                if (nodePartMap.get(source) === nodePartMap.get(target)) {
                    logger.write('\u2713' + ' ', Logger_1.LogColors.FgGreen, true);
                    _this._costs.internal[source] += edge_weight;
                }
                else {
                    logger.write('\u2717' + ' ', Logger_1.LogColors.FgRed, true);
                    _this._costs.external[source] += edge_weight;
                    partitioning.cut_cost += edge_weight;
                }
            });
            logger.log('');
        };
        var this_1 = this;
        try {
            for (var _b = __values(Object.keys(this._graph.getNodes())), _c = _b.next(); !_c.done; _c = _b.next()) {
                var source = _c.value;
                _loop_1(source);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        partitioning.cut_cost /= 2;
    };
    KLPartitioning.prototype.initGainsHeap = function () {
        var _this = this;
        var partitioning = this._partitionings.get(this._currentPartitioning), partition_iterator = partitioning.partitions.values(), first_partition = partition_iterator.next().value, second_partition = partition_iterator.next().value;
        var evalID = function (obj) { return obj.id; }, evalPriority = function (obj) { return obj.gain; };
        this._gainsHeap = new BinaryHeap_1.BinaryHeap(BinaryHeap_1.BinaryHeapMode.MAX, evalPriority, evalID);
        first_partition.nodes.forEach(function (source) {
            var source_id = source.getID();
            second_partition.nodes.forEach(function (target) {
                var target_id = target.getID();
                var edge_weight = 0;
                var adj_weight = parseFloat(_this._adjList[source_id][target_id]);
                if (!isNaN(adj_weight)) {
                    edge_weight = _this._config.weighted ? adj_weight : DEFAULT_WEIGHT;
                }
                var pair_gain = _this._costs.external[source_id] - _this._costs.internal[source_id] + _this._costs.external[target_id] - _this._costs.internal[target_id] - 2 * edge_weight;
                var gain_entry = {
                    id: source_id + "_" + target_id,
                    source: source,
                    target: target,
                    gain: pair_gain
                };
                _this._gainsHeap.insert(gain_entry);
                _this._gainsHash.set(gain_entry.id, gain_entry);
            });
        });
    };
    KLPartitioning.prototype.performIteration = function () {
        var ge = this.doSwapAndDropLockedConnections();
        this.updateCosts(ge);
        this._currentPartitioning++;
    };
    KLPartitioning.prototype.updateCosts = function (swap_ge) {
        this._gainsHash.forEach(function (k, v) {
            logger.log(k.id);
        });
        var partitioning = this._partitionings.get(this._currentPartitioning);
        partitioning.cut_cost -= swap_ge.gain;
        var partition_iterator = partitioning.partitions.keys(), first_partition = partition_iterator.next().value, second_partition = partition_iterator.next().value;
        [swap_ge.source, swap_ge.target].forEach(function (source) {
            var influencer = source.getID();
            source.allNeighbors().forEach(function (ne) {
                var source_id = ne.node.getID();
                logger.log("Cost update for node " + source_id);
                var gain_id;
                if (partitioning.nodePartMap.get(influencer) === first_partition) {
                    gain_id = influencer + "_" + source_id;
                }
                else {
                    gain_id = source_id + "_" + influencer;
                }
            });
        });
    };
    KLPartitioning.prototype.doSwapAndDropLockedConnections = function () {
        var _this = this;
        var gain_entry = this._gainsHeap.pop(), source_id = gain_entry.id.split('_')[0], target_id = gain_entry.id.split('_')[1];
        this._gainsHash.delete(gain_entry.id);
        var partitioning = this._partitionings.get(this._currentPartitioning), partition_iterator = partitioning.partitions.values(), first_partition = partition_iterator.next().value.nodes, second_partition = partition_iterator.next().value.nodes;
        logger.log("Swapping node pair (" + source_id + ", " + target_id + ")");
        first_partition.delete(source_id);
        first_partition.set(target_id, gain_entry.target);
        second_partition.delete(target_id);
        second_partition.set(source_id, gain_entry.source);
        second_partition.forEach(function (target) {
            var target_id = target.getID();
            _this.removeGainsEntry(source_id + "_" + target_id);
        });
        first_partition.forEach(function (source) {
            var source_id = source.getID();
            _this.removeGainsEntry(source_id + "_" + target_id);
        });
        return gain_entry;
    };
    KLPartitioning.prototype.removeGainsEntry = function (heap_id) {
        if (this._gainsHash.has(heap_id)) {
            this._gainsHeap.remove(this._gainsHash.get(heap_id));
            this._gainsHash.delete(heap_id);
        }
    };
    return KLPartitioning;
}());
exports.KLPartitioning = KLPartitioning;
