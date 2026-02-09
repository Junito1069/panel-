import { db, auth } from "./firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const formLogin = document.getElementById("formLogin");
const form = document.getElementById("formProducto");
const lista = document.getElementById("listaProductos");
const panelAdmin = document.getElementById("panelAdmin");
const buscador = document.getElementById("buscador");
const gbInput = document.getElementById("gb");
const precioInput = document.getElementById("precio");
const importador = document.getElementById("importador");
const btnImportar = document.getElementById("btnImportar");

let productosCache = [];

/* LOGIN */
formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        formLogin.style.display = "none";
        panelAdmin.style.display = "block";
        cargarProductos();
    } catch {
        alert("Error de login");
    }
});

/* FORMATO GB */
gbInput.addEventListener("input", () => {
    gbInput.value = gbInput.value.replace(/\D/g, "") + " GB";
});

/* FORMATO PRECIO */
precioInput.addEventListener("input", () => {
    let v = precioInput.value.replace(/\D/g, "");
    if (v) precioInput.value = Number(v).toLocaleString("en-US");
});

/* CARGAR PRODUCTOS */
async function cargarProductos() {
    lista.innerHTML = "";
    productosCache = [];
    const snapshot = await getDocs(collection(db, "productos"));
    snapshot.forEach(d => productosCache.push({ id: d.id, ...d.data() }));
    renderProductos(productosCache);
}

/* RENDER */
function renderProductos(productos) {
    lista.innerHTML = "";
    productos.forEach(p => {
        const tr = document.createElement("tr");
        tr.dataset.id = p.id;
        tr.innerHTML = `
            <td data-campo="marca">${p.marca}</td>
            <td data-campo="modelo">${p.modelo}</td>
            <td data-campo="gb">${p.gb}</td>
            <td data-campo="condicion">${p.condicion}</td>
            <td data-campo="precio">$${Number(p.precio).toLocaleString("en-US")}</td>
            <td>
                <button onclick="editarInline(this)">Editar</button>
                <button onclick="eliminarProducto('${p.id}')">Eliminar</button>
            </td>
        `;
        lista.appendChild(tr);
    });
}

/* BUSCADOR */
buscador.addEventListener("input", () => {
    const t = buscador.value.toLowerCase();
    renderProductos(productosCache.filter(p =>
        p.marca.includes(t) ||
        p.modelo.toLowerCase().includes(t)
    ));
});

/* GUARDAR NORMAL */
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "productos"), {
        marca: marca.value.toLowerCase(),
        modelo: modelo.value,
        gb: gb.value,
        condicion: condicion.value,
        precio: parseFloat(precioInput.value.replace(/,/g, ""))
    });
    form.reset();
    cargarProductos();
});

/* ELIMINAR */
window.eliminarProducto = async (id) => {
    if (confirm("¿Eliminar producto?")) {
        await deleteDoc(doc(db, "productos", id));
        cargarProductos();
    }
};

/* ===== EDICIÓN INLINE ===== */

window.editarInline = (btn) => {
    const tr = btn.closest("tr");
    tr.querySelectorAll("[data-campo]").forEach(td => {
        const v = td.innerText.replace("$", "").replace(/,/g, "");
        td.innerHTML = `<input value="${v}" style="width:100%">`;
    });
    btn.parentElement.innerHTML = `
        <button onclick="guardarInline(this)">Guardar</button>
        <button onclick="cancelarInline()">Cancelar</button>
    `;
};

window.guardarInline = async (btn) => {
    const tr = btn.closest("tr");
    const id = tr.dataset.id;
    const inputs = tr.querySelectorAll("input");

    await updateDoc(doc(db, "productos", id), {
        marca: inputs[0].value.toLowerCase(),
        modelo: inputs[1].value,
        gb: inputs[2].value,
        condicion: inputs[3].value,
        precio: parseFloat(inputs[4].value)
    });
    cargarProductos();
};

window.cancelarInline = () => cargarProductos();

/* IMPORTACIÓN MASIVA */
btnImportar.addEventListener("click", async () => {
    const lineas = importador.value.trim().split("\n");
    for (let l of lineas) {
        const [marca, modelo, gb, condicion, precio] = l.split("|").map(x => x.trim());
        if (!marca) continue;
        await addDoc(collection(db, "productos"), {
            marca: marca.toLowerCase(),
            modelo, gb, condicion,
            precio: parseFloat(precio)
        });
    }
    importador.value = "";
    cargarProductos();
});
