export enum EPage {
    Start = "start",
    Query = "query",
    Node = "node",
    Label = "label",
    Type = "type",
    Rel = "relationship",
    History = "history",
}

export enum EPropertyType {
    String = "String",
    Integer = "Integer",
    Float = "Float",
    Boolean = "Boolean",
    List = "List",
    Map = "Map",
    Point = "Point",
    Date = "Date",
    Time = "Time",
    DateTime = "DateTime",
    LocalTime = "LocalTime",
    LocalDateTime = "LocalDateTime",
    Duration = "Duration",
}

export enum EQueryView {
    Table = 1,
    Graph = 2,
    Summary = 3,
    JSON = 4,
}

export enum Ecosystem {
    Neo4j,
    Memgraph,
    Neptune,
}
