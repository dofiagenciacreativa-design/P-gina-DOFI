"use client";

import { useEffect, useRef, useState } from "react";
import { UsersThree } from "@phosphor-icons/react";

/**
 * LA DIANA (portada de Pauta Digital, elegida por el propietario el
 * 2026-11-25; reemplaza a las tres tarjetas de HeroProblema).
 *
 * La historia, con el título «Muchos likes, muchas vistas… pero ¿y las
 * ventas?»: un radar recorre un público enorme (los puntos) y enciende solo a
 * las PERSONAS CORRECTAS. Cada una se vuelve el ícono de la plataforma por la
 * que llega (WhatsApp, Instagram, Messenger, Facebook, TikTok, Google), viaja
 * al centro («tu negocio») y aparece abajo como un aviso: un mensaje, un
 * registro o un pedido. «Te escribieron» sube sin parar hasta 1.000.
 *
 * FLUIDEZ (lo que pidió el propietario: «no se veía fluido»):
 *  - El radar, los puntos y los íconos que viajan se dibujan en un <canvas>
 *    con un solo requestAnimationFrame; React no se vuelve a dibujar en cada
 *    cuadro (la cifra se escribe directo en el DOM).
 *  - Los avisos tienen posiciones fijas: el nuevo entra abajo y los demás
 *    SUBEN deslizándose (transform con transición); el más viejo se apaga
 *    arriba. Nada se inserta empujando a los otros de golpe.
 *  - Corre solo mientras se ve (IntersectionObserver). Con «menos
 *    movimiento» se ve un cuadro final quieto.
 *
 * ES UNA ILUSTRACIÓN: cifras y nombres son de ejemplo y lo dice abajo
 * («Cifras ilustrativas»). Para lectores de pantalla va una frase (sr-only).
 */

export type ClavePlataforma = "whatsapp" | "instagram" | "messenger" | "facebook" | "tiktok" | "google";
export type IconoPlataforma = { path: string; hex: string; nombre: string };

type Tipo = "Mensaje" | "Registro" | "Pedido";
type Aviso = { plataforma: ClavePlataforma; quien: string; texto: string; tipo: Tipo };

/** Los avisos, en el orden en que llegan (nombres y montos de ejemplo). */
const AVISOS: Aviso[] = [
  { plataforma: "whatsapp", quien: "María", texto: "¿Tienen envío a Cuenca?", tipo: "Mensaje" },
  { plataforma: "instagram", quien: "@carla.store", texto: "¿Cuánto cuesta el combo?", tipo: "Mensaje" },
  { plataforma: "facebook", quien: "Pedido nuevo", texto: "2 unidades · $45", tipo: "Pedido" },
  { plataforma: "google", quien: "Ana Torres", texto: "Llenó el formulario de contacto", tipo: "Registro" },
  { plataforma: "tiktok", quien: "Jorge", texto: "¿Dónde los encuentro?", tipo: "Mensaje" },
  { plataforma: "messenger", quien: "Pedro", texto: "Quiero agendar una cita", tipo: "Mensaje" },
  { plataforma: "instagram", quien: "Pedido nuevo", texto: "1 producto · $28", tipo: "Pedido" },
  { plataforma: "whatsapp", quien: "Luis", texto: "¿Aceptan pago con tarjeta?", tipo: "Mensaje" },
  { plataforma: "google", quien: "Sofía M.", texto: "Se registró al taller", tipo: "Registro" },
  { plataforma: "tiktok", quien: "Pedido nuevo", texto: "3 unidades · $62", tipo: "Pedido" },
  { plataforma: "messenger", quien: "Andrea", texto: "¿Atienden el sábado?", tipo: "Mensaje" },
  { plataforma: "whatsapp", quien: "Diego", texto: "Quiero comprar, ¿precio?", tipo: "Mensaje" },
];

const COLOR_TIPO: Record<Tipo, string> = {
  Mensaje: "border-brand-lift/50 text-[#C9B8FF]",
  Registro: "border-positive/50 text-positive",
  Pedido: "border-accent/60 text-accent-lift",
};

// Tiempos, en segundos.
const PRIMERO = 1.0; // el radar encuentra a la primera persona
const CADA = 0.95; // y luego a una cada…
const ULTIMO = 12.0; // hasta aquí encuentra gente
const VUELO = 1.15; // lo que tarda en llegar al centro
const ESPERA = 0.45; // brilla en su lugar antes de salir
const CICLO = 15.5; // y la historia vuelve a empezar
const FUNDIDO = 0.7;
const META = 1000; // «Te escribieron» llega a 1.000
const VISIBLES = 3;

const NUM = new Intl.NumberFormat("es-EC", { maximumFractionDigits: 0 });
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = (p: number) => 1 - Math.pow(1 - clamp(p), 3);
const enOut = (p: number) => 1 - Math.pow(1 - clamp(p), 2);

type Punto = { ang: number; rr: number; fase: number; brillo: number; libre: boolean };
type Viajero = { punto: number; aviso: Aviso; inicio: number; x0: number; y0: number; estela: { x: number; y: number }[] };
type AvisoEnPantalla = { id: number; aviso: Aviso };

export function HeroDiana({ iconos, className = "" }: { iconos: Record<ClavePlataforma, IconoPlataforma>; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const cifra = useRef<HTMLSpanElement>(null);
  const capa = useRef<HTMLDivElement>(null);
  const [avisos, setAvisos] = useState<AvisoEnPantalla[]>([]);

  useEffect(() => {
    const canvas = lienzo.current;
    const caja = raiz.current;
    if (!canvas || !caja) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // El lienzo no entiende var(--…): se lee el nombre real de la fuente Sora.
    const sora = getComputedStyle(document.documentElement).getPropertyValue("--font-sora").trim() || "system-ui";
    const trazos = Object.fromEntries(
      (Object.keys(iconos) as ClavePlataforma[]).map((k) => [k, new Path2D(iconos[k].path)])
    ) as Record<ClavePlataforma, Path2D>;

    // Tamaño real del lienzo (pantallas de alta densidad incluidas).
    let W = 1;
    let H = 1;
    const medir = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    medir();
    // Cambiar el tamaño del lienzo lo borra: se vuelve a dibujar en el acto
    // (al girar el teléfono, o si la animación está en pausa fuera de vista).
    const ro = new ResizeObserver(() => {
      medir();
      if (reducido) dibujarQuieto();
      else dibujar(t);
    });
    ro.observe(canvas);

    // El público: puntos repartidos en el disco.
    const puntos: Punto[] = Array.from({ length: 150 }, () => ({
      ang: Math.random() * Math.PI * 2,
      rr: 0.18 + Math.sqrt(Math.random()) * 0.8,
      fase: Math.random() * 6,
      brillo: 0,
      libre: true,
    }));
    let viajeros: Viajero[] = [];
    let siguiente = 0; // cuántas personas encontró el radar en esta vuelta
    let pulsos: number[] = []; // llegadas al centro (para el anillo naranja)
    let idAviso = 0;

    const geo = () => {
      const R = Math.min(W * 0.44, H * 0.31);
      return { cx: W * 0.5, cy: H * 0.45, R };
    };
    const posicion = (p: Punto, t: number, g: ReturnType<typeof geo>) => {
      const ang = p.ang + Math.sin(t * 0.35 + p.fase) * 0.025;
      return { x: g.cx + Math.cos(ang) * p.rr * g.R, y: g.cy + Math.sin(ang) * p.rr * g.R, ang };
    };
    const barridoEn = (t: number) => t * 1.3 - Math.PI / 2;

    function reiniciar() {
      viajeros = [];
      siguiente = 0;
      pulsos = [];
      for (const p of puntos) {
        p.libre = true;
        p.brillo = 0;
      }
      setAvisos([]);
    }

    /** El radar encuentra a alguien: el punto libre que acaba de barrer. */
    function encontrar(t: number) {
      const g = geo();
      const b = ((barridoEn(t) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      let mejor = -1;
      let menor = Infinity;
      // Solo personas a la vista: las de abajo quedan detrás de los avisos.
      const limite = H - (3 * 60 + 2 * 8 + 28) - 16;
      puntos.forEach((p, i) => {
        if (!p.libre || p.rr < 0.42) return;
        const pos = posicion(p, t, g);
        if (pos.y > limite) return;
        const a = ((pos.ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const atras = (b - a + Math.PI * 2) % (Math.PI * 2); // cuánto hace que lo barrió
        if (atras < menor) {
          menor = atras;
          mejor = i;
        }
      });
      if (mejor < 0) return;
      const aviso = AVISOS[siguiente % AVISOS.length];
      const pos = posicion(puntos[mejor], t, g);
      puntos[mejor].libre = false;
      viajeros.push({ punto: mejor, aviso, inicio: t, x0: pos.x, y0: pos.y, estela: [] });
      siguiente++;
    }

    function llegar(v: Viajero) {
      pulsos.push(0);
      idAviso++;
      const nuevo = { id: idAviso, aviso: v.aviso };
      setAvisos((lista) => [nuevo, ...lista].slice(0, VISIBLES + 1));
      // El punto vuelve al público en otro lugar, para que nunca se acabe.
      const p = puntos[v.punto];
      p.ang = Math.random() * Math.PI * 2;
      p.rr = 0.42 + Math.random() * 0.56;
      p.libre = true;
      p.brillo = 0;
      cifra.current?.parentElement?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
        { duration: 320, easing: "ease-out" }
      );
    }

    function insignia(x: number, y: number, r: number, k: ClavePlataforma, alfa: number) {
      ctx!.save();
      ctx!.globalAlpha = alfa;
      ctx!.shadowColor = `#${iconos[k].hex === "000000" ? "FF0050" : iconos[k].hex}`;
      ctx!.shadowBlur = 14;
      ctx!.fillStyle = `#${iconos[k].hex}`;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
      ctx!.lineWidth = 1.5;
      ctx!.strokeStyle = "rgba(255,255,255,0.75)";
      ctx!.stroke();
      const s = r * 1.15;
      ctx!.translate(x - s / 2, y - s / 2);
      ctx!.scale(s / 24, s / 24);
      ctx!.fillStyle = "#fff";
      ctx!.fill(trazos[k]);
      ctx!.restore();
    }

    function dibujar(t: number, quieto = false) {
      const g = geo();
      const { cx, cy, R } = g;
      const c = ctx!;
      const fuera = t > CICLO - FUNDIDO ? clamp((CICLO - t) / FUNDIDO) : clamp(t / 0.5);
      const alfa = quieto ? 1 : fuera;
      const barrido = barridoEn(t);
      c.clearRect(0, 0, W, H);
      c.save();
      c.globalAlpha = alfa;
      if (capa.current) capa.current.style.opacity = String(alfa);

      // Disco y anillos.
      const disco = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.08);
      disco.addColorStop(0, "rgba(109,75,201,0.22)");
      disco.addColorStop(0.7, "rgba(109,75,201,0.08)");
      disco.addColorStop(1, "rgba(109,75,201,0)");
      c.fillStyle = disco;
      c.beginPath();
      c.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
      c.fill();
      for (let k = 1; k <= 4; k++) {
        c.beginPath();
        c.arc(cx, cy, (R * k) / 4, 0, Math.PI * 2);
        c.strokeStyle = `rgba(180,155,255,${k === 4 ? 0.28 : 0.1 + 0.03 * k})`;
        c.lineWidth = k === 4 ? 1.2 : 1;
        c.stroke();
      }
      c.strokeStyle = "rgba(180,155,255,0.07)";
      c.beginPath();
      c.moveTo(cx - R, cy);
      c.lineTo(cx + R, cy);
      c.moveTo(cx, cy - R);
      c.lineTo(cx, cy + R);
      c.stroke();
      // Marcas en el borde, como un radar de verdad.
      for (let k = 0; k < 72; k++) {
        const a = (k / 72) * Math.PI * 2;
        const l = k % 6 === 0 ? 7 : 3;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        c.lineTo(cx + Math.cos(a) * (R + l), cy + Math.sin(a) * (R + l));
        c.strokeStyle = "rgba(180,155,255,0.22)";
        c.stroke();
      }

      // El barrido: abanico con degradado y borde encendido.
      if (!quieto) {
        c.save();
        c.translate(cx, cy);
        c.rotate(barrido);
        const abanico = 1.05;
        if ("createConicGradient" in c) {
          const cg = c.createConicGradient(-abanico, 0, 0);
          cg.addColorStop(0, "rgba(138,91,255,0)");
          cg.addColorStop(abanico / (Math.PI * 2), "rgba(138,91,255,0.34)");
          cg.addColorStop(abanico / (Math.PI * 2) + 0.0001, "rgba(138,91,255,0)");
          c.fillStyle = cg;
          c.beginPath();
          c.moveTo(0, 0);
          c.arc(0, 0, R, -abanico, 0);
          c.closePath();
          c.fill();
        }
        c.shadowColor = "rgba(190,165,255,0.9)";
        c.shadowBlur = 10;
        c.strokeStyle = "rgba(214,200,255,0.95)";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(R, 0);
        c.stroke();
        c.restore();
      }

      // El público: cada punto se enciende un instante cuando lo barren.
      const b = ((barrido % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      for (const p of puntos) {
        if (!p.libre) continue;
        const pos = posicion(p, t, g);
        const a = ((pos.ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const atras = (b - a + Math.PI * 2) % (Math.PI * 2);
        const luz = quieto ? 0.25 : Math.exp(-atras * 2.2);
        c.fillStyle = `rgba(226,216,255,${0.28 + 0.6 * luz})`;
        c.beginPath();
        c.arc(pos.x, pos.y, 1.8 + 1.3 * luz, 0, Math.PI * 2);
        c.fill();
      }

      // El centro: tu negocio.
      const latido = 0.5 + 0.5 * Math.sin(t * 2.4);
      const halo = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.34);
      halo.addColorStop(0, `rgba(255,148,64,${0.5 + 0.12 * latido})`);
      halo.addColorStop(1, "rgba(255,148,64,0)");
      c.fillStyle = halo;
      c.beginPath();
      c.arc(cx, cy, R * 0.34, 0, Math.PI * 2);
      c.fill();
      pulsos = pulsos.filter((e) => e < 1);
      for (const e of pulsos) {
        c.beginPath();
        c.arc(cx, cy, 12 + e * R * 0.42, 0, Math.PI * 2);
        c.strokeStyle = `rgba(255,148,64,${0.75 * (1 - e)})`;
        c.lineWidth = 2;
        c.stroke();
      }
      c.save();
      c.shadowColor = "rgba(255,148,64,0.95)";
      c.shadowBlur = 18;
      c.fillStyle = "#FF9440";
      c.beginPath();
      c.arc(cx, cy, 9, 0, Math.PI * 2);
      c.fill();
      c.restore();
      c.font = `600 10px ${sora}, system-ui, sans-serif`;
      c.textAlign = "center";
      c.fillStyle = "rgba(255,220,190,0.9)";
      c.fillText("TU NEGOCIO", cx, cy + 26);

      // Las personas correctas: brillan, se vuelven el ícono y viajan al centro.
      for (const v of viajeros) {
        const e = t - v.inicio;
        const vuelo = clamp((e - ESPERA) / VUELO);
        const anillo = clamp(e / 0.6);
        if (anillo < 1) {
          c.beginPath();
          c.arc(v.x0, v.y0, 8 + anillo * 18, 0, Math.PI * 2);
          c.strokeStyle = `rgba(255,148,64,${0.9 * (1 - anillo)})`;
          c.lineWidth = 2;
          c.stroke();
        }
        // Curva suave hacia el centro (pasa un poco por fuera de la recta).
        const q = suave(vuelo);
        const mx = (v.x0 + cx) / 2 + (v.y0 - cy) * 0.25;
        const my = (v.y0 + cy) / 2 - (v.x0 - cx) * 0.25;
        const x = (1 - q) * (1 - q) * v.x0 + 2 * (1 - q) * q * mx + q * q * cx;
        const y = (1 - q) * (1 - q) * v.y0 + 2 * (1 - q) * q * my + q * q * cy;
        if (vuelo > 0) {
          // Si el ícono «saltó» (la animación estuvo en pausa o cambió el
          // tamaño), la estela empieza de nuevo: nunca una raya larga.
          const ult = v.estela[v.estela.length - 1];
          if (ult && Math.hypot(x - ult.x, y - ult.y) > 30) v.estela = [];
          v.estela.push({ x, y });
          if (v.estela.length > 14) v.estela.shift();
          for (let i = 1; i < v.estela.length; i++) {
            const f = i / v.estela.length;
            c.beginPath();
            c.moveTo(v.estela[i - 1].x, v.estela[i - 1].y);
            c.lineTo(v.estela[i].x, v.estela[i].y);
            c.strokeStyle = `rgba(255,170,110,${0.45 * f})`;
            c.lineWidth = 3 * f;
            c.lineCap = "round";
            c.stroke();
          }
        }
        const crece = suave(e / 0.35);
        const r = (6 + 7 * crece) * (1 - 0.35 * q);
        insignia(x, y, r, v.aviso.plataforma, vuelo > 0.92 ? clamp((1 - vuelo) / 0.08) : 1);
      }
      c.restore();
    }

    // Cuadro final quieto (menos movimiento): íconos repartidos, avisos y 1.000.
    function dibujarQuieto() {
      const g = geo();
      dibujar(CICLO - 2, true);
      const k = Object.keys(iconos) as ClavePlataforma[];
      k.forEach((clave, i) => {
        const a = (i / k.length) * Math.PI * 2 - 0.6;
        insignia(g.cx + Math.cos(a) * g.R * 0.7, g.cy + Math.sin(a) * g.R * 0.7, 11, clave, 1);
      });
    }

    let t = 0;
    if (reducido) {
      setAvisos(AVISOS.slice(0, VISIBLES).map((aviso, i) => ({ id: i + 1, aviso })).reverse());
      if (cifra.current) cifra.current.textContent = NUM.format(META);
      dibujarQuieto();
      return () => ro.disconnect();
    }

    let previo: number | null = null;
    let cuadro = 0;
    const paso = (ahora: number) => {
      if (previo === null) previo = ahora;
      const dt = Math.min(0.05, (ahora - previo) / 1000);
      previo = ahora;
      t += dt;
      if (t >= CICLO) {
        t = 0;
        reiniciar();
      }
      // El radar encuentra a alguien a ritmo fijo.
      while (t <= ULTIMO && t >= PRIMERO + siguiente * CADA) encontrar(t);
      // Llegadas al centro.
      viajeros = viajeros.filter((v) => {
        if (t - v.inicio >= ESPERA + VUELO) {
          llegar(v);
          return false;
        }
        return true;
      });
      pulsos = pulsos.map((e) => e + dt / 0.9);
      // «Te escribieron» sube todo el tiempo hasta 1.000.
      if (cifra.current) cifra.current.textContent = NUM.format(Math.round(META * enOut((t - 0.6) / 11.4)));
      dibujar(t);
      cuadro = requestAnimationFrame(paso);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!cuadro) {
            previo = null;
            cuadro = requestAnimationFrame(paso);
          }
        } else {
          cancelAnimationFrame(cuadro);
          cuadro = 0;
        }
      },
      { threshold: 0.15 }
    );
    io.observe(caja);
    reiniciar();
    dibujar(0);

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(cuadro);
    };
  }, [iconos]);

  return (
    <div
      ref={raiz}
      className={`relative mx-auto h-[540px] w-full max-w-[480px] sm:h-[590px] lg:h-[min(600px,var(--alto-util))] lg:min-h-[500px] ${className}`}
    >
      <p className="sr-only">
        Ilustración con cifras de ejemplo: un radar recorre un público de 120 mil personas y encuentra a las personas
        correctas, que escriben por WhatsApp, Instagram, Messenger, Facebook, TikTok y Google; te escribieron 1.000.
      </p>

      <div aria-hidden="true" className="absolute inset-0">
        <canvas ref={lienzo} className="absolute inset-0 h-full w-full" />

        <div ref={capa}>
        {/* Te escribieron */}
        <div className="absolute left-0 top-0 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-lift">Te escribieron</p>
          <p className="origin-left font-display text-[2.25rem] font-extrabold leading-none tabular-nums text-foam sm:text-[2.6rem]">
            <span ref={cifra}>0</span>
          </p>
          <p className="mt-1 font-sans text-xs text-mist">mensajes, registros y pedidos</p>
        </div>

        {/* El público */}
        <div className="absolute right-0 top-0 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 font-sans text-xs text-foam/90 backdrop-blur-md">
          <UsersThree size={16} weight="fill" className="text-mist" />
          Público <b className="font-display tabular-nums">120 mil</b>
        </div>

        {/* Los avisos: posiciones fijas; el nuevo entra abajo y los demás suben. */}
        <div className="absolute inset-x-0 bottom-7 h-[calc(3*3.75rem+2*0.5rem)]">
          {avisos.map(({ id, aviso }, i) => {
            const ic = iconos[aviso.plataforma];
            return (
              <div
                key={id}
                className="diana-aviso absolute inset-x-0 bottom-0 h-[3.75rem] sm:left-[6%]"
                style={
                  {
                    transform: `translateY(calc(${-i} * (100% + 0.5rem)))`,
                    opacity: i >= VISIBLES ? 0 : 1 - i * 0.16,
                  } as React.CSSProperties
                }
              >
                <div className="diana-aviso-entra flex h-full items-center gap-3 rounded-2xl border border-white/15 bg-[rgba(36,22,78,0.72)] px-3 shadow-[0_18px_36px_-22px_rgba(0,0,0,0.8)] backdrop-blur-md">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/25"
                    style={{ background: `#${ic.hex}` }}
                  >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                      <path d={ic.path} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[13px] font-semibold leading-tight text-foam">
                      {aviso.quien} <span className="font-sans font-normal text-mist">· {ic.nombre}</span>
                    </span>
                    <span className="block truncate font-sans text-[13px] leading-snug text-foam/80">{aviso.texto}</span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 font-sans text-[11px] font-semibold ${COLOR_TIPO[aviso.tipo]}`}>
                    {aviso.tipo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        </div>

        <p className="absolute inset-x-0 bottom-0 text-center font-sans text-xs text-mist/70">Cifras ilustrativas</p>
      </div>
    </div>
  );
}
