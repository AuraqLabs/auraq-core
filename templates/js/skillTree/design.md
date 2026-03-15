Uses panning module as data-panning-axis="xy" to enable movement in both directions

Grid
- m = number of branches + nodes with same layer on the layer with highest number of nodes with same layer
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

An edge is a svg path between two nodes
- No idea currently how to implement it
