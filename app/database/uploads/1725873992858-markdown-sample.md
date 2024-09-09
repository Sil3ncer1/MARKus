---  
layout: test Layout  
title: test Titel  
---

![fh-logo](https://www.fh-dortmund.de/openGraph-200x200.png){100,100}

# Guten Morgen Timmy

## Guten Morgen in kleiner

* * *

### Plain Text:

**Lorem** _ipsum_ `dolor sit amet`, ~~consectetur~~ [Github](https://github.com/YukkiTimmy/projektarbeit-markdown) ??Esse??. H^2O laboriosam earum, neque, illo ducimus at ipsam, dolor consequatur maiores harum inventore molestias repudiandae eius veritatis necessitatibus exercitationem temporibus reprehenderit?

### Code Block:

```
function heapSort(arr) {
    var n = arr.length;
    
    for (var i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(arr, n, i);
    for (var i = n - 1; i > 0; i--) {
        var temp = arr[0];
        arr[0] = arr[i];
        arr[i] = temp;
    
        heapify(arr, i, 0);
    }
}
```

### Lists:

*   Create a list by starting a line with `+`, `-`, or `*`
*   Sub-lists are made by indenting 2 spaces:
    *   Marker character change forces new list start:
        *   Ac tristique libero volutpat at
        *   Facilisis in pretium nisl aliquet
        *   Nulla volutpat aliquam velit
*   Very easy!

1.  Make my changes
    1.  Fix bug
    2.  Improve formatting
        *   Make the headings bigger
2.  Push my commits to GitHub
3.  Open a pull request

*   [x]  Finish my changes
*   [ ]  Push my commits to GitHub
*   [ ]  Open a pull request
*   [x]  @mentions, #refs, links, **formatting**, and ~~tags~~ supported
*   [x]  list syntax required (any unordered or ordered list supported)
*   [x]  this is a complete item
*   [ ]  this is an incomplete item

### Tabellen:

| Option | Description |
| --- | --- |
| data | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext | extension to be used for dest files. |

### Blockzitat:

> Blockquotes can also be nested...
> 
> > ...by using additional greater-than signs right next to each other...
> > 
> > > ...or with spaces between arrows.