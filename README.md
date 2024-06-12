![cypherGUI](./public/logo.svg)

# Introduction

User friendly GUI administration tool for graph databases with bolt protocol support. Usable without knowledge of cypher query language.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z5ABMLW)

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/stefanak-michal/cyphergui/auto-deploy.yml)](https://github.com/stefanak-michal/cyphergui/actions/workflows/auto-deploy.yml)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/stefanak-michal/cyphergui?cacheSeconds=0)](https://github.com/stefanak-michal/cyphergui/releases)
[![GitHub commits since latest release](https://img.shields.io/github/commits-since/stefanak-michal/cyphergui/latest?cacheSeconds=0)](https://github.com/stefanak-michal/cyphergui/releases/latest)

### :camera: Screenshosts

Available in [wiki](https://github.com/stefanak-michal/cyphergui/wiki/Screenshots).

## :heavy_check_mark: Supported databases

-   [Neo4j](https://neo4j.com/)
-   [Memgraph](https://memgraph.com/)
-   [Amazon Neptune](https://aws.amazon.com/neptune/) - Not tested. :raising_hand: Looking for somebody who can offer access to it.
-   [DozerDB](https://dozerdb.org/)

## :heavy_multiplication_x: Not supported

-   [ONgDB](https://graphfoundation.org/projects/ongdb/) - Latest version v1.0.5 not supported because is based on old version which requires Bolt v2. This library use official javascript driver which dropped support for an old version already.

## :label: Features

-   View Nodes by Label and Relationships by Type as sortable table
-   Search across all properties in Label or Type table view
-   Create, edit or delete Nodes and Relationships and their properties
-   Check before closing Node or Relationship tab with unsaved changes
-   Write cypher queries and view the result as table, json or graph
-   Multi database support ([Neo4j](https://neo4j.com/docs/cypher-manual/current/databases/), [Memgraph](https://memgraph.com/docs/configuration/multi-tenancy))
-   Stash to keep Nodes, Relationships and queries for fast access
-   Can be run locally (file:///)

# :computer: Usage

## GitHub pages

You can access this project on GitHub pages at url [https://stefanak-michal.github.io/cyphergui/](https://stefanak-michal.github.io/cyphergui/). With this deployment you are limited only to database with enabled encryption (protocols bolt+s and neo4j+s).

## Local instance

You can either install node.js, clone the repository, run `npm install` and `npm start`.

Or you can download branch [gh-pages](https://github.com/stefanak-michal/cyphergui/tree/gh-pages), unpack it and open `index.html` in your favorite browser.
