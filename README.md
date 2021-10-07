# Simufast

Simulate fast using visual abstractions. This is an embeddable widget built using [createjs](https://createjs.com/) for graphics and animations in HTML canvas.

The idea of simulation was inspired by the amazing interactive posts like [this](https://ciechanow.ski/internal-combustion-engine/) by [@bciechanowski](https://twitter.com/bciechanowski)

## Usage

* Include the simufast JS and CSS files in your html page.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/simufast@0.0.6/src/simufast.css">
<script src="https://cdn.jsdelivr.net/npm/simufast@0.0.6/dist/main.js"></script>
```

> Note: This project is in the proof of concept stage. The APIs may change. Please use specific version of the js and css files to avoid breaking changes.

* Add a script tag with the simulation code. An example of bubble sort simulation is as below

```html
<script>
    const bubbleSort = async (items, options) => {
      for (let i = 0; i < items.length; i++) {
          for (let j = 0; j < items.length - i - 1; j++) {
              if (await items.compareAtIndex(j, j + 1) > 0) { // compares and highlights the elements being compared
                  await items.swap(j, j + 1); // swaps and animates the elements being swapped
              }
              await options.onStepCompleted(); // allows pause & play
          }
      }
    }

    simufast.run((player) => { // embeds the simufast player
      const items = simufast.array.createVisualArray(player, simufast.utils.randIntArray(9, 10, 99)); // draws the array
      player.experiment({ // runs the experiments as per the commands
          name: 'Bubble Sort',
          drawable: items,
          commands: [(options) => bubbleSort(items, options)]
      });
    });
</script>
```

Checkout one of the below examples in [JSBin](https://jsbin.com/tazuwuz/edit?html,output) to try your own.

## Examples

* [Bubble sort](https://jsbin.com/tazuwuz/edit?html,output)
* [Selection sort](https://jsbin.com/nequjey/edit?html,output)
* Modulo Hashing vs Consistent Hashing
  * [Blog](https://tech.endeepak.com/blog/2021/09/22/visual-simulation-of-consistent-hashing)
  * [JSBin](https://jsbin.com/fuvavun/edit?html,output)

## How to run and test locally

```
npm install
npm run build:dev
open index.html
```
