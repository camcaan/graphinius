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
var BaseEdge_1 = require("../../core/base/BaseEdge");
var EdgeDupeChecker = (function () {
    function EdgeDupeChecker(_graph) {
        this._graph = _graph;
    }
    EdgeDupeChecker.prototype.isDupe = function (e) {
        var e_1, _a;
        var pds = this.potentialEndpoints(e);
        if (!pds.size) {
            return false;
        }
        try {
            for (var _b = __values(pds.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var pd = _c.value;
                if (!EdgeDupeChecker.checkTypeWeightEquality(e, pd)
                    || !EdgeDupeChecker.typeWeightDupe(e, pd)) {
                    pds.delete(pd);
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
        return !!pds.size;
    };
    EdgeDupeChecker.prototype.potentialEndpoints = function (e) {
        var result = new Set();
        if (e.dir) {
            e.a.nextNodes().forEach(function (ne) {
                (ne.node === e.b) && result.add(ne.edge);
            });
        }
        else {
            e.a.connNodes().forEach(function (ne) {
                (ne.node === e.b) && result.add(ne.edge);
            });
        }
        return result;
    };
    EdgeDupeChecker.checkTypeWeightEquality = function (e, oe) {
        return BaseEdge_1.BaseEdge.isTyped(oe) === e.typed && e.weighted === oe.isWeighted();
    };
    EdgeDupeChecker.typeWeightDupe = function (e, oe) {
        var neitherTypedNorWeighted = !e.typed && !e.weighted;
        var notTypedButWeighted = !e.typed && e.weighted;
        var weightEqual = e.weight === oe.getWeight();
        var typeEqual = e.typed && BaseEdge_1.BaseEdge.isTyped(oe) && e.type === oe.type;
        return (neitherTypedNorWeighted || notTypedButWeighted && weightEqual || typeEqual);
    };
    return EdgeDupeChecker;
}());
exports.EdgeDupeChecker = EdgeDupeChecker;
