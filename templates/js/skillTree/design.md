Uses panning module as data-panning-axis="xy" to enable movement in both directions

Filter: Selecting a particular domain or institute will disable (dim) all nodes that are not of the selected filter

Grid
- m = number of nodes in the most populous layer
- n = highest number of layers

A node is a div with [w] and [h], containing following elements
- Domain
- Display
- Insitute
- Year

A node's position will be
- Offset by 50% transform in x and y axis (to center it)
- Based on the position of grid's row (course layer) and grid's column (course branch)

A node has
- border-radius
- border

A node:hover
- Enlarges a bit
- The border color changes to domain color

A node:click
- Glows in domain color
- Background dims a bit

A node popup is a div with [w] and [h], which opens up when node is pressed. It has the following elements
- Domain - Course
- A close button
- Name
- Description
- Tags
- Link to course site
- Arrow to the related node

A node popup's position will be
- Left of selected node if: Node is towards right of canvas center && the screen is in desktop mode (vw > 800px)
- RIght of selected node if: Node is towards left of canvas center && the screen is in desktop mode (vw > 800px)
- Below the selected node if: Screen is in mobile mode (vw <= 800px)

An edge is a svg path between two nodes
- Inferred at render time
- Connects every node at layer N to every node at layer N+1 within the same branch
- Is a cubic-bezier path from bottom-center of the source node to top-center of target node
- with two control points set to vertical mid point of the two, producing smooth S curve
- Branches with no adjacent layer produce no edge

Notes
- Since axis is xy, the container div must has overflow-y: clip and overflow-x: auto
- Use outline for glow, instead of box shadow
