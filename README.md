![cypherGUI](./public/logo.svg)

# Introduction

User friendly GUI administration tool for graph databases with bolt protocol support. Usable without knowledge of cypher query language.

<a href='https://ko-fi.com/Z8Z5ABMLW' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## :heavy_check_mark: Supported databases

- [Neo4j](https://neo4j.com/) 
- [Memgraph](https://memgraph.com/) 
- [Amazon Neptune](https://aws.amazon.com/neptune/) - Not tested. :raising_hand: Looking for somebody who can offer me access to it.

# :label: Features

- List nodes by Label as sortable table
- List relationships by Type as sortable table
- Search across all properties in Label or Type table view
- Create/edit/delete nodes and relationships
- Modify nodes/relationships properties
- Write cypher queries and view the result as table/json/graph
- Multi database support ([docs](https://neo4j.com/docs/cypher-manual/current/databases/))
- Stash to keep nodes, relationships and queries for fast access

# :computer: Usage

## GitHub pages

You can access this project on GitHub pages at url [https://stefanak-michal.github.io/cyphergui/](https://stefanak-michal.github.io/cyphergui/). With this deployment you are limited only to database with enabled encryption (protocols bolt+s and neo4j+s).

## Local instance

You can either install node.js, clone the repository, run `npm install` and `npm start`.

Or you can download branch [gh-pages](https://github.com/stefanak-michal/cyphergui/tree/gh-pages), unpack it and open `index.html` in your favorite browser.
