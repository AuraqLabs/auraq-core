TODO

Behavior of link:-
- click: linked page opens on same tab
- ctrl+click: linked page opens
- hover: popups up the Link Preview
- spacebar: preview pins, doesn't collapse when cursor leaves
- click outside / press esc: outermost preview unpins (stack pop)
- A link hovered inside a pinned preview spawns a child preview normally

Appearance of Preview:-
- small card with preview of page, beneath which are two icons for
opening the link on same tab or new tab
- the card much appear above or beneath the object of link, determined
by the object's position in viewport
- background dimmed by 20% upon first pinned preview
- dim overlay does not deepen with nesting - it's applied once at page level when stack length goes from 0 → 1, removed when stack returns to 0

Constraits:
- icons might be hard to press on phone so bigger hitbox
- certain links can be made to have no preview if no preview is setup
