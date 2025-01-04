import { sfc32, classNames, makeMagicSquare } from "./util.js";
import Sortable from "https://unpkg.com/sortablejs?module";

const html = htm.bind(m);

// Data model
const Data = {
  descriptions: null,

  syncDescriptions() {
    Data.descriptions =
      Data.descriptions ??
      JSON.parse(localStorage.getItem("bingoDescriptions") ?? "null") ??
      Array(24).fill("");

    localStorage.setItem(
      "bingoDescriptions",
      JSON.stringify(Data.descriptions),
    );
  },

  drag(from, to) {
    let [moved] = Data.descriptions.splice(from, 1);
    Data.descriptions.splice(to, 0, moved);
    Data.syncDescriptions();
  },

  update(index, value) {
    Data.descriptions[index] = value;
    Data.syncDescriptions();
  },
};

// Sync data with localStorage
Data.syncDescriptions();

// Mithril Components

/** A feather-icons icon */
const Icon = () => {
  return {
    view(vnode) {
      const name = vnode.attrs.name;
      const others = Object.fromEntries(
        Object.entries(vnode.attrs).filter(([key, _]) => key != "name"),
      );
      return m.trust(feather.icons[name].toSvg(others));
    },
  };
};

/** An editable text field */
function EditableField(initialVnode) {
  var editing = false;
  var contents = initialVnode.attrs.value;

  return {
    view(vnode) {
      return editing
        ? html`
            <input
              value=${contents}
              oninput=${(e) => {
                contents = e.target.value;
                vnode.attrs.onChange(contents);
                e.redraw = false;
              }}
              onkeydown=${(e) => {
                if (e.code == "Enter") {
                  editing = false;
                  m.redraw();
                  return;
                }
                e.redraw = false;
              }}
              onfocusout=${() => {
                editing = false;
              }}
          ></input>
          `
        : html`
            <span
              onclick=${() => {
                editing = true;
              }}
              class=${classNames({ resolution: true, empty: contents == "" })}
              >${contents == "" ? "empty" : contents}</span
            >
          `;
    },

    onupdate(vnode) {
      if (editing) {
        vnode.dom.focus();
        vnode.dom.select();
      }
    },
  };
}

function getBarColor(difficulty) {
  const frac = difficulty / 24;
  const base = 140,
    strong = 217;

  const red = base + (strong - base) * frac;
  const green = base + (strong - base) * (1 - frac);
  const blue = base;
  return `rgb(${red}, ${green}, ${blue})`;
}

const GoalCreationPage = () => {
  let sortable;
  let order = Array.from(Array(24)).map((_, i) => i);

  return {
    oncreate(vnode) {
      sortable = Sortable.create(vnode.dom.querySelector(".entry-container"), {
        handle: ".handle",
        animation: 300,
        onEnd: (evt) => {
          let [deleted] = order.splice(evt.oldIndex, 1);
          order.splice(evt.newIndex, 0, deleted);
          Data.drag(evt.oldIndex, evt.newIndex);
          m.redraw();
        },
      });

      feather.replace({ width: 16, height: 16 });
    },

    view() {
      return html`
        <div class="entry-center">
          <div class="entry-container">
            ${order.map((key, i) => {
              return html`
                <div class="entry" key=${key}>
                  <div
                    class="handle"
                    style="background-color: ${getBarColor(i)};"
                  >
                    <span class="center-aligned">
                      <${Icon}
                        name="move"
                        width="16"
                        height="16"
                        style="margin-right: 2px;"
                      />
                      <span>(difficulty ${i + 1})</span>
                    </span>
                  </div>
                  <div class="editor-container">
                    <${EditableField}
                      value=${Data.descriptions[i]}
                      onChange=${(c) => Data.update(i, c)}
                    />
                  </div>
                </div>
              `;
            })}
          </div>
        </div>

        <div class="submit">
          <button onclick=${() => m.route.set("/render")}>
            <span class="center-aligned">
              <${Icon}
                name="file-plus"
                width="20"
                height="20"
                style="margin-right: 2px;"
              />
              <span>Generate Bingo</span>
            </span>
          </button>
        </div>
      `;
    },
  };
};

const RenderSquarePage = () => {
  let seed = "default-seed";
  let square = makeMagicSquare(sfc32(seed)).flat();

  let worked = false;

  return {
    view(vnode) {
      const getDescription = (i, j) => {
        if (i == 2 && j == 2) {
          return html`<span>Free</span>`;
        } else {
          const score = square[i * 5 + j];
          const description = Data.descriptions[score - 1];
          if (description == "") {
            return html`<span class="empty-cell" key=${score}>(empty)</span>`;
          }
          return html`<span key="${score}">${description}</span>`;
        }
      };

      return html`
        <div class="render">
          <button onclick=${() => m.route.set("/home")}>
            <span class="center-aligned">
              <${Icon}
                name="arrow-left"
                width="20"
                height="20"
                stroke-width="2"
                style="margin-right: 2px;"
              />
              <span>Edit Goals</span>
            </span>
          </button>
          <div class="table-container">
            <table>
              ${[0, 1, 2, 3, 4].map(
                (i) => html`
                  <tr>
                    ${[0, 1, 2, 3, 4].map(
                      (j) => html`
                        <td
                          class=${classNames({
                            "free-space": i == 2 && j == 2,
                          })}
                        >
                          <div>${getDescription(i, j)}</div>
                        </td>
                      `,
                    )}
                  </tr>
                `,
              )}
            </table>

            <button
              class=${classNames({ "copy-button": true, worked: worked })}
              onclick=${async () => {
                // const clip = await navigator.clipboard.read();
                // const blob = await clip[0].getType("text/html");
                // console.log(await blob.text());
                const root = document.querySelector(".table-container > table");

                function visit(node) {
                  const computedStyle = window.getComputedStyle(node);
                  const computedStyleDefault = window.getComputedStyle(
                    document.createElement(node.tagName),
                  );
                  const newNode = node.cloneNode(false);
                  for (const property of computedStyle) {
                    if (
                      computedStyle[property] != computedStyleDefault[property]
                    ) {
                      newNode.style[property] = computedStyle[property];
                    }
                  }
                  for (let child of node.childNodes) {
                    if (child instanceof HTMLElement) {
                      newNode.appendChild(visit(child));
                    } else {
                      newNode.appendChild(child.cloneNode(false));
                    }
                  }
                  return newNode;
                }

                const copied = visit(root);

                const blob = new Blob([copied.outerHTML], {
                  type: "text/html",
                });
                const data = new ClipboardItem({ "text/html": blob });
                await navigator.clipboard.write([data]);
                console.log("hi");
                worked = true;
                m.redraw();
                setTimeout(() => {
                  worked = false;
                  m.redraw();
                }, 1000);
              }}
            >
              <span class="center-aligned">
                <${Icon}
                  name="copy"
                  width="16"
                  height="16"
                  style="margin-right: 2px;"
                />
                <span>Copy to clipboard</span>
              </span>
            </button>
          </div>

          <hr />
          <h2>Configuration</h2>

          <span>Random seed: </span
          ><input
            oninput=${(ev) => {
              seed = ev.target.value;
              square = makeMagicSquare(sfc32(seed)).flat();
              m.redraw();
            }}
            value=${seed}
          />
        </div>
      `;
    },
  };
};

window.addEventListener("load", () => {
  m.route(document.body, "/create-goals", {
    "/create-goals": GoalCreationPage,
    "/render-square": RenderSquarePage,
  });

  document.body.addEventListener("keydown", (ev) => {
    if (ev.code == "Tab" && m.route.get() == "/create-goals") {
      document.querySelector(".resolution.empty").click();
      ev.preventDefault();
    }
  });
});
