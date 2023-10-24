import * as React from "react";
import { Node as _Node, Relationship as _Relationship } from "neo4j-driver";
import db from "../db";
import { IStashEntry, IStashManager, ITabManager } from "../utils/interfaces";
import { Button } from "../components/form";
import InlineNode from "../components/InlineNode";
import InlineRelationship from "../components/InlineRelationship";
import { EPage } from "../utils/enums";
import { t_StashQuery } from "../utils/types";

interface IStashProps {
    stashed: IStashEntry[];
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
        if (this.state.tab === "Nodes" && !(entry.value instanceof _Node)) return false;
        if (this.state.tab === "Relationships" && !(entry.value instanceof _Relationship)) return false;
        if (this.state.tab === "Queries" && !(entry.value instanceof t_StashQuery)) return false;
        //search
        if (this.state.search.length === 0) return true;
        if (db.strInt(entry.value.identity) === this.state.search) return true;
        if ("elementId" in entry.value && db.hasElementId && entry.value.elementId.includes(this.state.search)) return true;
        if (entry.value instanceof _Node && entry.value.labels.includes(this.state.search)) return true;
        if (entry.value instanceof _Relationship && entry.value.type === this.state.search) return true;
        if (entry.value instanceof t_StashQuery && entry.value.query.indexOf(this.state.search) >= 0) return true;
        return false;
    };

    render() {
        let a = [];
        for (let i = 0; i < 20; i++) {
            a.push(
                <a className="panel-block">
                    <span className="panel-icon">
                        <i className="fas fa-book" aria-hidden="true" />
                    </span>
                    bulma
                </a>
            );
        }

        return (
            <section className={"stash panel is-dark " + (this.state.active ? "is-active" : "")}>
                <div
                    className="panel-heading is-clickable wspace-nowrap"
                    onClick={() =>
                        this.setState(state => {
                            return {
                                active: !state.active,
                            };
                        })
                    }>
                    <span className={"icon mr-2 animate__animated " + (this.state.pulse ? "animate__swing" : "")} onAnimationEnd={() => this.setState({ pulse: false })}>
                        <i className={"fa-regular fa-folder" + (this.state.active ? "-open" : "")} />
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
                                <i className="fas fa-search" aria-hidden="true" />
                            </span>
                            <span className="icon is-right is-clickable" onClick={() => this.setState({ search: "" })}>
                                <i className="fa-solid fa-xmark" />
                            </span>
                        </p>
                    </div>
                    <p className="panel-tabs">
                        {["All", "Nodes", "Relationships", "Queries"].map(t => (
                            <a key={t} className={this.state.tab === t ? "is-active" : ""} onClick={() => this.setState({ tab: t })}>
                                {t}
                            </a>
                        ))}
                    </p>
                    {this.props.stashed.filter(this.filter).map(entry => (
                        <div className="panel-block is-hoverable" key={entry.id}>
                            {entry.value instanceof _Node && <InlineNode node={entry.value} tabManager={this.props.tabManager} database={entry.database} small={true} />}
                            {entry.value instanceof _Relationship && <InlineRelationship rel={entry.value} tabManager={this.props.tabManager} database={entry.database} small={true} />}
                            {entry.value instanceof t_StashQuery && (
                                <a
                                    className="is-align-items-center"
                                    title={entry.value.query.length > 25 ? entry.value.query : ""}
                                    onClick={() =>
                                        this.props.tabManager.add(entry.value.identity as string, "fa-solid fa-terminal", EPage.Query, {
                                            query: entry.value["query"],
                                        })
                                    }>
                                    {entry.value.query.substring(0, 25)} {entry.value.query.length > 25 ? "..." : ""}
                                </a>
                            )}
                            {(entry.value instanceof _Node || entry.value instanceof _Relationship) && db.databases.length > 1 && <span className="ml-1">(db: {entry.database})</span>}
                            <button className="delete ml-auto" onClick={() => this.props.stashManager.remove(entry.id)} />
                        </div>
                    ))}
                    {this.props.stashed.filter(this.filter).length === 0 && <span className="panel-block has-text-grey-light">empty</span>}
                    <div className="panel-block">
                        <Button text="Clear stash" color="is-link is-outlined is-fullwidth" onClick={() => this.props.stashManager.empty()} />
                    </div>
                </div>
            </section>
        );
    }
}

export default Stash;
