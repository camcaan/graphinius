import { IGraph } from '../core/base/BaseGraph';
export declare type InitMap = {
    [id: string]: number;
};
export declare type TeleSet = {
    [id: string]: number;
};
export declare type RankMap = {
    [id: string]: number;
};
export interface PRArrayDS {
    curr: Array<number>;
    old: Array<number>;
    out_deg: Array<number>;
    pull: Array<Array<number>>;
    pull_weight?: Array<Array<number>>;
    teleport?: Array<number>;
    tele_size?: number;
}
export interface PagerankRWConfig {
    weighted?: boolean;
    alpha?: number;
    epsilon?: number;
    maxIterations?: number;
    normalize?: boolean;
    PRArrays?: PRArrayDS;
    personalized?: boolean;
    tele_set?: TeleSet;
    init_map?: InitMap;
}
export interface PRResult {
    map: RankMap;
    config: PagerankRWConfig;
    iters: number;
    delta: number;
}
declare class Pagerank {
    private _graph;
    private readonly _weighted;
    private readonly _alpha;
    private readonly _epsilon;
    private readonly _maxIterations;
    private readonly _normalize;
    private readonly _personalized;
    private readonly _PRArrayDS;
    constructor(_graph: IGraph, config?: PagerankRWConfig);
    getConfig(): PagerankRWConfig;
    getDSs(): PRArrayDS;
    constructPRArrayDataStructs(config: PagerankRWConfig): void;
    getRankMapFromArray(): RankMap;
    private normalizePR;
    pull2DTo1D(): Array<number>;
    computePR(): PRResult;
}
export { Pagerank };
