"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
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
var TypedNode_1 = require("./TypedNode");
var TypedEdge_1 = require("./TypedEdge");
var BaseEdge_1 = require("../base/BaseEdge");
var BaseGraph_1 = require("../base/BaseGraph");
var run_config_1 = require("../../config/run_config");
var BaseNode_1 = require("../base/BaseNode");
var interfaces_1 = require("../interfaces");
var TypedGraph = (function (_super) {
    __extends(TypedGraph, _super);
    function TypedGraph(_label) {
        var _this = _super.call(this, _label) || this;
        _this._label = _label;
        _this._typedNodes = new Map();
        _this._typedEdges = new Map();
        _this._type = run_config_1.GENERIC_TYPES.Graph;
        _this._typedNodes.set(run_config_1.GENERIC_TYPES.Node, new Map());
        _this._typedEdges.set(run_config_1.GENERIC_TYPES.Edge, new Map());
        return _this;
    }
    TypedGraph.prototype.n = function (id) {
        return this.getNodeById(id);
    };
    Object.defineProperty(TypedGraph.prototype, "type", {
        get: function () {
            return this._type;
        },
        enumerable: true,
        configurable: true
    });
    TypedGraph.prototype.nodeTypes = function () {
        return Array.from(this._typedNodes.keys());
    };
    TypedGraph.prototype.edgeTypes = function () {
        return Array.from(this._typedEdges.keys());
    };
    TypedGraph.prototype.nrTypedNodes = function (type) {
        type = type.toUpperCase();
        return this._typedNodes.get(type) ? this._typedNodes.get(type).size : null;
    };
    TypedGraph.prototype.nrTypedEdges = function (type) {
        type = type.toUpperCase();
        return this._typedEdges.get(type) ? this._typedEdges.get(type).size : null;
    };
    TypedGraph.prototype.ins = function (node, type) {
        var _this = this;
        var targets = node.ins(type);
        if (targets) {
            return new Set(__spread(targets).map(function (uid) { return _this.n(TypedNode_1.TypedNode.nIDFromUID(uid)); }));
        }
    };
    TypedGraph.prototype.outs = function (node, type) {
        var _this = this;
        var targets = node.outs(type);
        if (targets) {
        }
        return new Set(__spread(targets).map(function (uid) { return _this.n(TypedNode_1.TypedNode.nIDFromUID(uid)); }));
    };
    TypedGraph.prototype.unds = function (node, type) {
        var _this = this;
        var targets = node.unds(type);
        if (targets) {
            return new Set(__spread(targets).map(function (uid) { return _this.n(TypedNode_1.TypedNode.nIDFromUID(uid)); }));
        }
    };
    TypedGraph.convertToExpansionResult = function (input) {
        if (BaseNode_1.BaseNode.isTyped(input)) {
            return { set: new Set([input]), freq: new Map() };
        }
        else if (input instanceof Set) {
            return { set: input, freq: new Map() };
        }
        else {
            return input;
        }
    };
    TypedGraph.prototype.expand = function (input, dir, type) {
        var e_1, _a, e_2, _b;
        var nodes = TypedGraph.convertToExpansionResult(input);
        var resultSet = new Set();
        var freqMap = new Map();
        try {
            for (var _c = __values(nodes.set), _d = _c.next(); !_d.done; _d = _c.next()) {
                var node = _d.value;
                var targets = node[dir](type);
                if (!targets) {
                    continue;
                }
                try {
                    for (var targets_1 = (e_2 = void 0, __values(targets)), targets_1_1 = targets_1.next(); !targets_1_1.done; targets_1_1 = targets_1.next()) {
                        var target = targets_1_1.value;
                        var nodeRef = this.n(TypedNode_1.TypedNode.nIDFromUID(target));
                        if (!freqMap.has(nodeRef)) {
                            if (nodes.freq.get(node)) {
                                freqMap.set(nodeRef, nodes.freq.get(node));
                            }
                            else {
                                freqMap.set(nodeRef, 1);
                            }
                        }
                        if (resultSet.has(nodeRef)) {
                            freqMap.set(nodeRef, freqMap.get(nodeRef) + nodes.freq.get(node));
                        }
                        resultSet.add(nodeRef);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (targets_1_1 && !targets_1_1.done && (_b = targets_1.return)) _b.call(targets_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return { set: resultSet, freq: freqMap };
    };
    TypedGraph.prototype.expandK = function (input, dir, type, cfg) {
        var e_3, _a;
        if (cfg === void 0) { cfg = {}; }
        if (cfg.k < 0) {
            throw new Error('cowardly refusing to expand a negative number of steps.');
        }
        var k = cfg.k && cfg.k < this._nr_nodes ? cfg.k : this._nr_nodes - 1;
        var nodes = TypedGraph.convertToExpansionResult(input);
        var resultSet = new Set();
        var freqMap = new Map();
        while (k--) {
            nodes = this.expand(nodes, dir, type);
            try {
                for (var _b = (e_3 = void 0, __values(nodes.set)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var nodeRef = _c.value;
                    if (!freqMap.has(nodeRef)) {
                        freqMap.set(nodeRef, nodes.freq.get(nodeRef));
                    }
                    if (resultSet.has(nodeRef)) {
                        freqMap.set(nodeRef, freqMap.get(nodeRef) + nodes.freq.get(nodeRef));
                    }
                    resultSet.add(nodeRef);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        return { set: resultSet, freq: freqMap };
    };
    TypedGraph.prototype.peripheryAtK = function (input, dir, type, cfg) {
        if (cfg === void 0) { cfg = {}; }
        if (cfg.k < 0) {
            throw new Error('cowardly refusing to expand a negative number of steps.');
        }
        var nodes = TypedGraph.convertToExpansionResult(input);
        var k = cfg.k && cfg.k < this._nr_nodes ? cfg.k : this._nr_nodes - 1;
        for (var it_1 = 0; it_1 < k; it_1++) {
            nodes = this.expand(nodes, dir, type);
        }
        return nodes;
    };
    TypedGraph.prototype.inHistT = function (nType, eType) {
        return this.degreeHistT(interfaces_1.DIR.in, nType, eType);
    };
    TypedGraph.prototype.outHistT = function (nType, eType) {
        return this.degreeHistT(interfaces_1.DIR.out, nType, eType);
    };
    TypedGraph.prototype.connHistT = function (nType, eType) {
        return this.degreeHistT(interfaces_1.DIR.und, nType, eType);
    };
    TypedGraph.prototype.degreeHistT = function (dir, nType, eType) {
        var e_4, _a;
        var result = [];
        try {
            for (var _b = __values(this._typedNodes.get(nType)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), node_id = _d[0], node = _d[1];
                var deg = void 0;
                switch (dir) {
                    case interfaces_1.DIR.in:
                        deg = node.ins(eType) ? node.ins(eType).size : 0;
                        break;
                    case interfaces_1.DIR.out:
                        deg = node.outs(eType) ? node.outs(eType).size : 0;
                        break;
                    default:
                        deg = node.unds(eType) ? node.unds(eType).size : 0;
                }
                if (!result[deg]) {
                    result[deg] = new Set([node]);
                }
                else {
                    result[deg].add(node);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return result;
    };
    TypedGraph.prototype.addNodeByID = function (id, opts) {
        if (this.hasNodeID(id)) {
            throw new Error("Won't add node with duplicate ID.");
        }
        var node = new TypedNode_1.TypedNode(id, opts);
        return this.addNode(node) ? node : null;
    };
    TypedGraph.prototype.addNode = function (node) {
        if (!_super.prototype.addNode.call(this, node)) {
            return null;
        }
        var id = node.getID(), type = node.type ? node.type.toUpperCase() : null;
        if (!type) {
            this._typedNodes.get(run_config_1.GENERIC_TYPES.Node).set(id, node);
        }
        else {
            if (!this._typedNodes.get(type)) {
                this._typedNodes.set(type, new Map());
            }
            this._typedNodes.get(type).set(id, node);
        }
        return node;
    };
    TypedGraph.prototype.getNodeById = function (id) {
        return _super.prototype.getNodeById.call(this, id);
    };
    TypedGraph.prototype.getNodesT = function (type) {
        return this._typedNodes.get(type.toUpperCase());
    };
    TypedGraph.prototype.getEdgesT = function (type) {
        return this._typedEdges.get(type.toUpperCase());
    };
    TypedGraph.prototype.deleteNode = function (node) {
        var id = node.getID(), type = node.type ? node.type.toUpperCase() : run_config_1.GENERIC_TYPES.Node;
        if (!this._typedNodes.get(type)) {
            throw Error('Node type does not exist on this TypedGraph.');
        }
        var removeNode = this._typedNodes.get(type).get(id);
        if (!removeNode) {
            throw Error('This particular node is nowhere to be found in its typed set.');
        }
        this._typedNodes.get(type).delete(id);
        if (this.nrTypedNodes(type) === 0) {
            this._typedNodes.delete(type);
        }
        _super.prototype.deleteNode.call(this, node);
    };
    TypedGraph.prototype.addEdgeByID = function (id, a, b, opts) {
        var edge = new TypedEdge_1.TypedEdge(id, a, b, opts || {});
        return this.addEdge(edge);
    };
    TypedGraph.prototype.addEdge = function (edge) {
        if (!_super.prototype.addEdge.call(this, edge)) {
            return null;
        }
        var id = edge.getID();
        var type = run_config_1.GENERIC_TYPES.Edge;
        if (BaseEdge_1.BaseEdge.isTyped(edge) && edge.type) {
            type = edge.type.toUpperCase();
        }
        if (id === type) {
            this._typedEdges.get(run_config_1.GENERIC_TYPES.Edge).set(id, edge);
        }
        else {
            if (!this._typedEdges.get(type)) {
                this._typedEdges.set(type, new Map());
            }
            this._typedEdges.get(type).set(id, edge);
        }
        return edge;
    };
    TypedGraph.prototype.deleteEdge = function (edge) {
        var id = edge.getID();
        var type = run_config_1.GENERIC_TYPES.Edge;
        if (BaseEdge_1.BaseEdge.isTyped(edge) && edge.type) {
            type = edge.type.toUpperCase();
        }
        if (!this._typedEdges.get(type)) {
            throw Error('Edge type does not exist on this TypedGraph.');
        }
        var removeEdge = this._typedEdges.get(type).get(id);
        if (!removeEdge) {
            throw Error('This particular edge is nowhere to be found in its typed set.');
        }
        this._typedEdges.get(type).delete(id);
        if (this.nrTypedEdges(type) === 0) {
            this._typedEdges.delete(type);
        }
        _super.prototype.deleteEdge.call(this, edge);
    };
    TypedGraph.prototype.getStats = function () {
        var typed_nodes = {}, typed_edges = {};
        this._typedNodes.forEach(function (k, v) { return typed_nodes[v] = k.size; });
        this._typedEdges.forEach(function (k, v) { return typed_edges[v] = k.size; });
        return __assign(__assign({}, _super.prototype.getStats.call(this)), { typed_nodes: typed_nodes,
            typed_edges: typed_edges });
    };
    return TypedGraph;
}(BaseGraph_1.BaseGraph));
exports.TypedGraph = TypedGraph;
