import { db, auth } from "./firebase.js";
import {
    collection, addDoc, getDocs, deleteDoc,
    doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signInWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const formLogin = document.getElementById("formLogin");
const form = document.getElementById("formProducto");
const panelAdmin = document.getElementById("panelAdmin");
const lista = document.getElementById("listaProductos");
const buscador = document.getElementById("buscador");
const btnGuardarCambios = document.getElementById("btnGuardarCambios");

let productosCache = [];
let cambiosPendientes = {};

/* LOGIN */
formLogin.addEventListener("submit", async e => {
    e.preventDefault();
    await signInWithEmailAndPassword(auth, email.value, password.value);
    formLogin.style.display = "none";
    panelAdmin.style.display = "block";
    cargarProductos();
});

/* AGREGAR NUEVO (NO SE TOCA) */
form.addEventListener("submit", async e => {
    e.preventDefault();
    await addDoc(collection(db, "productos"), {
        marca: marca.value.toLowerCase(),
        modelo: modelo.value,
        gb: gb.value,
        condicion: condicion.value,
        precio: parseFloat(precio.value)
    });
    form.reset();
    cargarProductos();
});

/* CARGAR */
async function cargarProductos() {
    lista.innerHTML = "";
    productosCache = [];
    cambiosPendientes = {};

    const snap = await getDocs(collection(db, "productos"));
    snap.forEach(d => productosCache.push({ id: d.id, ...d.data() }));
    render(productosCache);
}

/* RENDER */
function render(productos) {
    lista.innerHTML = "";
    productos.forEach(p => {
        const tr = document.createElement("tr");
        tr.dataset.id = p.id;
        tr.innerHTML = `
            <td data-campo="marca">${p.marca}</td>
            <td data-campo="modelo">${p.modelo}</td>
            <td data-campo="gb">${p.gb}</td>
            <td data-campo="condicion">${p.condicion}</td>
            <td data-campo="precio">${p.precio}</td>
            <td>
                <button type="button" onclick="editarInline(this)">Editar</button>
                <button type="button" onclick="eliminarProducto('${p.id}')">Eliminar</button>
            </td>
        `;
        lista.appendChild(tr);
    });
}

/* BUSCADOR */
buscador.addEventListener("input", () => {
    const t = buscador.value.toLowerCase();
    render(productosCache.filter(p =>
        p.modelo.toLowerCase().includes(t) ||
        p.marca.includes(t)
    ));
});

/* EDITAR INLINE */
window.editarInline = (btn) => {
    const tr = btn.closest("tr");
    const id = tr.dataset.id;

    tr.querySelectorAll("[data-campo]").forEach(td => {
        const campo = td.dataset.campo;
        td.innerHTML = `<input data-campo="${campo}" value="${td.innerText}" style="width:100%">`;
    });

    cambiosPendientes[id] = {};
};

/* CAPTURAR CAMBIOS */
lista.addEventListener("input", e => {
    if (e.target.tagName !== "INPUT") return;
    const tr = e.target.closest("tr");
    const id = tr.dataset.id;
    const campo = e.target.dataset.campo;

    cambiosPendientes[id][campo] =
        campo === "precio"
        ? parseFloat(e.target.value)
        : e.target.value;
});

/* GUARDAR TODOS */
btnGuardarCambios.addEventListener("click", async () => {
    const ids = Object.keys(cambiosPendientes);
    if (!ids.length) return alert("No hay cambios");

    for (let id of ids) {
        await updateDoc(doc(db, "productos", id), cambiosPendientes[id]);
    }

    cargarProductos();
    alert("Cambios guardados ✅");
});

/* ELIMINAR */
window.eliminarProducto = async id => {
    if (confirm("¿Eliminar producto?")) {
        await deleteDoc(doc(db, "productos", id));
        cargarProductos();
    }
};
