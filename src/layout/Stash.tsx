import * as React from "react";
import { Node as Neo4jNode, Relationship as Neo4jRelationship } from "neo4j-driver";
import db from "../db";
import { ISettings, IStashEntry, IStashManager, ITabManager } from "../interfaces";
import { EPage } from "../enums";
import { LabelButton, TypeButton } from "../form";

interface IStashProps {
    stashed: IStashEntry[];
    settings: ISettings;
    tabManager: ITabManager;
    stashManager: IStashManager;
}

interface IStashState {
    active: boolean;
    search: string;
    tab: string;
    pulse: boolean;
}

class Stash extends React.Component<IStashProps, IStashState> {
    state: IStashState = {
        active: false,
        search: "",
        tab: "All",
        pulse: false,
    };

    shouldComponentUpdate = (nextProps: Readonly<IStashProps>): boolean => {
        if (this.props.stashed.length !== nextProps.stashed.length && !this.state.pulse) this.setState({ pulse: true });
        return true;
    };

    filter = (entry: IStashEntry): boolean => {
        //tab
        if (this.state.tab === "Nodes" && !(entry.value instanceof Neo4jNode)) return false;
        if (this.state.tab === "Relationships" && !(entry.value instanceof Neo4jRelationship)) return false;
        //search
        if (this.state.search.length === 0) return true;
        if (db.neo4j.integer.toString(entry.value.identity) === this.state.search) return true;
        if (db.hasElementId && entry.value.elementId.indexOf(this.state.search) !== -1) return true;
        if (entry.value instanceof Neo4jNode && entry.value.labels.indexOf(this.state.search) !== -1) return true;
        if (entry.value instanceof Neo4jRelationship && entry.value.type === this.state.search) return true;
        return false;
    };

    render() {
        let a = [];
        for (let i = 0; i < 20; i++) {
            a.push(
                <a className="panel-block">
                    <span className="panel-icon">
                        <i className="fas fa-book" aria-hidden="true"></i>
                    </span>
                    bulma
                </a>
            );
        }

        return (
            <nav className={"panel is-dark stash " + (this.state.active ? "is-active" : "")}>
                <div
                    className="panel-heading is-clickable"
                    onClick={() =>
                        this.setState(state => {
                            return {
                                active: !state.active,
                            };
                        })
                    }>
                    <span className={"icon mr-2 animate__animated " + (this.state.pulse ? "animate__swing" : "")} onAnimationEnd={() => this.setState({ pulse: false })}>
                        <i className={"fa-regular fa-folder" + (this.state.active ? "-open" : "")}></i>
                    </span>
                    Stash
                </div>
                <div className="panel-body">
                    <div className="panel-block">
                        <p className="control has-icons-left has-icons-right">
                            <input
                                className="input"
                                type="text"
                                placeholder="Search"
                                value={this.state.search}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.setState({ search: e.currentTarget.value })}
                            />
                            <span className="icon is-left">
                                <i className="fas fa-search" aria-hidden="true"></i>
                            </span>
                            <span className="icon is-right is-clickable" onClick={() => this.setState({ search: "" })}>
                                <i className="fa-solid fa-xmark"></i>
                            </span>
                        </p>
                    </div>
                    <p className="panel-tabs">
                        {["All", "Nodes", "Relationships"].map(t => (
                            <a key={t} className={this.state.tab === t ? "is-active" : ""} onClick={() => this.setState({ tab: t })}>
                                {t}
                            </a>
                        ))}
                    </p>
                    {this.props.stashed.filter(this.filter).map(entry => (
                        <div className="panel-block is-hoverable" key={entry.id}>
                            <a
                                className="is-align-items-center is-flex is-justify-content-flex-start"
                                onClick={() =>
                                    this.props.tabManager.add(
                                        { prefix: entry.value instanceof Neo4jNode ? "Node" : "Rel", i: entry.value.identity },
                                        "fa-solid fa-pen-to-square",
                                        entry.value instanceof Neo4jNode ? EPage.Node : EPage.Rel,
                                        { id: db.hasElementId ? entry.value.elementId : entry.value.identity, database: entry.database }
                                    )
                                }>
                                <span className="panel-icon">
                                    <i className={entry.value instanceof Neo4jNode ? "fa-regular fa-circle" : "fa-solid fa-arrow-right-long"} aria-hidden="true"></i>
                                </span>
                                {db.neo4j.integer.toString(entry.value.identity)}
                                {this.props.settings.showElementId && db.hasElementId ? <span className="is-size-7 ml-1">[{entry.value.elementId}]</span> : ""}
                                <span className="ml-1">(db: {entry.database})</span>
                            </a>
                            <span className="ml-2 mr-1">
                                {entry.value instanceof Neo4jNode &&
                                    entry.value.labels.map(label => <LabelButton key={label} label={label} database={entry.database} tabManager={this.props.tabManager} size="mr-1" />)}
                                {entry.value instanceof Neo4jRelationship && (
                                    <TypeButton key={entry.value.type} type={entry.value.type} database={entry.database} tabManager={this.props.tabManager} size="mr-1" />
                                )}
                            </span>
                            <button className="delete ml-auto" onClick={() => this.props.stashManager.remove(entry.id)}></button>
                        </div>
                    ))}
                    {this.props.stashed.filter(this.filter).length === 0 && <span className="panel-block has-text-grey-light">empty</span>}
                    <div className="panel-block">
                        <button className="button is-link is-outlined is-fullwidth" onClick={() => this.props.stashManager.empty()}>
                            Clear stash
                        </button>
                    </div>
                </div>
            </nav>
        );
    }
}

export default Stash;
