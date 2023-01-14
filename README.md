# cypherGUI

GUI admin tool for graph databases with bolt protocol support (neo4j, memgraph, amazon neptune). Usable without knowledge of cypher query language. Inspired by phpmyadmin.

## WIP

## links

- https://fontawesome.com/search?o=r&m=free
- https://bulma.io/documentation/
- https://reactjs.org/docs/getting-started.html
- https://www.taniarascia.com/getting-started-with-react/
- https://devhints.io/react
- https://css-tricks.com/snippets/css/a-guide-to-flexbox/
- https://github.com/neo4j/neo4j-javascript-driver
- https://github.com/memgraph/orb
- https://javascript.info/promise-api
- https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forms_and_events/
- https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

## todo

- log console somewhere (new tab, btn to open in Start and navbar?) ..can be used logger from neo4j driver to fill it up?
- Canvas side column with details on node/rel click
- Add missing types (date, time, point, ...) for properties in edit tab (node/rel)
- query db - make a fn to avoid direct call neo4j driver. To make it possible use different driver if neccesary. That means it requires update on neo4j Integer usage.
- https://create-react-app.dev/docs/deployment/#github-pages
- clean up public dir
