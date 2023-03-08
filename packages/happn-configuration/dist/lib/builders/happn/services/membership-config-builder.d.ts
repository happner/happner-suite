declare const BaseBuilder: any;
export declare class MembershipConfigBuilder extends BaseBuilder {
    constructor();
    withMembershipClusterName(name: string): MembershipConfigBuilder;
    withMembershipDisseminationFactor(factor: number): MembershipConfigBuilder;
    withMembershipHost(host: string): MembershipConfigBuilder;
    withMembershipJoinTimeout(timeout: number): MembershipConfigBuilder;
    withMembershipJoinType(joinType: string): MembershipConfigBuilder;
    withMembershipMemberHost(host: string): MembershipConfigBuilder;
    withMembershipPingInterval(interval: number): MembershipConfigBuilder;
    withMembershipPingTimeout(timeout: number): MembershipConfigBuilder;
    withMembershipPingReqTimeout(timeout: number): MembershipConfigBuilder;
    withMembershipPingReqGroupSize(size: number): MembershipConfigBuilder;
    withMembershipPort(port: number): MembershipConfigBuilder;
    withMembershipRandomWait(wait: number): MembershipConfigBuilder;
    withMembershipIsSeed(isSeed: boolean): MembershipConfigBuilder;
    withMembershipSeedWait(wait: number): MembershipConfigBuilder;
    withMembershipUdpMaxDgramSize(size: number): MembershipConfigBuilder;
}
export {};
