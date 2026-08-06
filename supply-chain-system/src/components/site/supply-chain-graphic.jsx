
import { motion } from "framer-motion";
import { Tractor, Warehouse, Truck, ShoppingBasket } from "lucide-react";

const nodes = [
  { label: "Supplier", Icon: Tractor, text: "Products & inventory upload" },
  { label: "Warehouse", Icon: Warehouse, text: "Capacity & storage control" },
  { label: "Logistics", Icon: Truck, text: "Assignments & shipment updates" },
  { label: "Customer", Icon: ShoppingBasket, text: "Orders, tracking & verification" },
];

export function SupplyChainGraphic() {
  return (
    <div className="relative rounded-3xl border border-slate-800 bg-slate-950/20 p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-30 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(255,255,255,0))]" />

      <div className="relative flex flex-col gap-4">
        {/* rail */}
        <div className="pointer-events-none absolute bottom-10 left-4 top-10 w-px">
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            style={{
              transformOrigin: "top",
              background:
                "linear-gradient(to bottom, rgba(16,185,129,0.3), #10b981, #7c3aed)",
            }}
            className="h-full w-px"
          />
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ top: "0%", opacity: 0 }}
              animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, delay: i * 1.05, ease: "linear" }}
              className="absolute left-1/2 size-2 -translate-x-1/2 rounded-full bg-emerald-500 shadow-[0_0_14px_4px_#10b981]"
            />
          ))}
        </div>

        {nodes.map(({ label, Icon, text }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.22, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center gap-4 pl-10"
          >
            <span className="absolute left-4 top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-500 bg-[#030712]" />
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/30 px-4 py-3.5 backdrop-blur">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-slate-450">{text}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
