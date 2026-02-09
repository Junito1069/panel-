import { db, auth } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

let editId = null;
let productosCache = [];

/* LOGIN */
formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(
            auth,
            formLogin.email.value,
            formLogin.password.value
        );
        formLogin.style.display = "none";
        panelAdmin.style.display = "block";
        cargarProductos();
    } catch (error) {
        alert("Error de login");
    }
});

/* FORMATO GB */
gbInput.addEventListener("input", () => {
    let v = gbInput.value.replace(/\D/g, "");
    if (v) gbInput.value = v + " GB";
});
gbInput.addEventListener("focus", () => {
    gbInput.value = gbInput.value.replace(/\D/g, "");
});
gbInput.addEventListener("blur", () => {
    let v = gbInput.value.replace(/\D/g, "");
    if (v) gbInput.value = v + " GB";
});

/* FORMATO PRECIO */
precioInput.addEventListener("input", () => {
    let v = precioInput.value.replace(/,/g, "").replace(/\D/g, "");
    if (v) precioInput.value = Number(v).toLocaleString("en-US");
});

/* CARGAR PRODUCTOS */
async function cargarProductos() {
    lista.innerHTML = "";
    productosCache = [];

    const snapshot = await getDocs(collection(db, "productos"));
    snapshot.forEach(docu => {
        productosCache.push({ id: docu.id, ...docu.data() });
    });

    renderProductos(productosCache);
}

/* RENDER TABLA */
function renderProductos(productos) {
    lista.innerHTML = "";

    productos.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.marca}</td>
            <td>${p.modelo}</td>
            <td>${p.gb}</td>
            <td>${p.condicion}</td>
            <td>$${Number(p.precio).toLocaleString("en-US")}</td>
            <td>
                <button onclick="editarProducto('${p.id}')">Editar</button>
                <button onclick="eliminarProducto('${p.id}')">Eliminar</button>
            </td>
        `;
        lista.appendChild(tr);
    });
}

/* BUSCADOR */
buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    renderProductos(
        productosCache.filter(p =>
            p.marca.includes(texto) ||
            p.modelo.toLowerCase().includes(texto) ||
            p.gb.toLowerCase().includes(texto) ||
            p.condicion.toLowerCase().includes(texto)
        )
    );
});

/* GUARDAR / EDITAR */
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const producto = {
        marca: form.marca.value.toLowerCase(),
        modelo: form.modelo.value,
        gb: form.gb.value,
        condicion: form.condicion.value,
        precio: parseFloat(precioInput.value.replace(/,/g, ""))
    };

    if (editId) {
        await updateDoc(doc(db, "productos", editId), producto);
        editId = null;
    } else {
        await addDoc(collection(db, "productos"), producto);
    }

    form.reset();
    cargarProductos();
});

/* EDITAR */
window.editarProducto = async (id) => {
    const snap = await getDoc(doc(db, "productos", id));
    if (snap.exists()) {
        const d = snap.data();
        form.marca.value = d.marca;
        form.modelo.value = d.modelo;
        form.gb.value = d.gb;
        form.condicion.value = d.condicion;
        precioInput.value = Number(d.precio).toLocaleString("en-US");
        editId = id;
    }
};

/* ELIMINAR */
window.eliminarProducto = async (id) => {
    if (confirm("¿Eliminar producto?")) {
        await deleteDoc(doc(db, "productos", id));
        cargarProductos();
    }
};

/* 🔥 IMPORTACIÓN MASIVA */
btnImportar.addEventListener("click", async () => {
    const texto = importador.value.trim();
    if (!texto) return alert("No hay datos");

    const lineas = texto.split("\n");

    for (let linea of lineas) {
        const [marca, modelo, gb, condicion, precio] =
            linea.split("|").map(x => x.trim());

        if (!marca || !modelo || !gb || !condicion || !precio) continue;

        await addDoc(collection(db, "productos"), {
            marca: marca.toLowerCase(),
            modelo,
            gb,
            condicion,
            precio: parseFloat(precio)
        });
    }

    importador.value = "";
    cargarProductos();
    alert("Productos importados correctamente ✅");
});
