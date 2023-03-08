export interface ICoreBuilder {
    set builderType(type: string);
    get builderType(): string;
    build(): any;
}
