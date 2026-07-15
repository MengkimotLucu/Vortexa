import { TestimonialsColumn, type Testimonial } from "./testimonials-columns-1";
import { motion } from "motion/react";

interface TestimonialsProps {
  lang?: "en" | "id";
}

const testimonialsData: Record<"en" | "id", Testimonial[]> = {
  id: [
    {
      text: "Website kami loading di bawah 1 detik dan konversi penjualan dari WhatsApp naik signifikan sejak migrasi ke platform modern dari Lumovelo. Performa luar biasa!",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      name: "Budi Santoso",
      role: "Founder, HijabStyle",
    },
    {
      text: "Kerja sama yang sangat transparan. Kode web kami bersih, tanpa dependency berlebih yang lambat, dan peringkat SEO Google kami meningkat tajam dalam sebulan.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      name: "Anita Wijaya",
      role: "CTO ",
    },
    {
      text: "Otomatisasi respon WhatsApp dari Lumovelo menghemat waktu operasional tim CS kami secara drastis. Integrasi AI mereka bekerja sangat cerdas dan praktis.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      name: "Rendra Kurniawan",
      role: "Direktur, Logistik Express",
    },
    {
      text: "Kecepatan loading website kami kini mendapat nilai A di GTmetrix. Sangat berdampak pada iklan berbayar kami yang menjadi jauh lebih efisien dan murah.",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
      name: "Hendra Wijaya",
      role: "Growth Lead ",
    },
    {
      text: "Sistem booking online otomatis yang diintegrasikan ke WhatsApp sangat mengurangi bounce rate. Lumovelo benar-benar memahami alur bisnis lokal kami.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      name: "Siti Rahma",
      role: "Owner, BeautySalon & Spa",
    },
    {
      text: "Desain UI/UX yang dibuat Lumovelo sangat fresh dan modern. Pengunjung betah berlama-lama di web kami, bounce rate turun hingga 40% dalam beberapa minggu.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      name: "Dian",
      role: "Head of Marketing ",
    },
    {
      text: "Kami sangat terbantu dengan dashboard CMS kustom dari Lumovelo. Sekarang admin kami bisa upload produk baru dan update stok hanya dalam 2 klik dari HP.",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
      name: "Agus Pratama",
      role: "Founder, CoffeeHouse Bandung",
    },
    {
      text: "Fitur kalkulator harga otomatis di website sangat membantu calon pembeli melakukan estimasi sebelum memesan. Inovatif, responsif, dan fungsional!",
      image: "https://images.unsplash.com/photo-1534751516642-a131ffd10795?w=150&h=150&fit=crop&crop=face",
      name: "Dewi Lestari",
      role: "Founder ",
    },
    {
      text: "Konsultasi teknis dengan tim Lumovelo sangat solutif. Mereka merekomendasikan solusi serverless yang membuat kami tidak perlu membayar biaya hosting bulanan.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      name: "Faisal ",
      role: "Tech Lead ",
    },
  ],
  en: [
    {
      text: "Our website loads in under 1 second and sales conversion from WhatsApp increased significantly since migrating to Lumovelo's modern platform. Outstanding performance!",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      name: "Budi Santoso",
      role: "Founder, HijabStyle",
    },
    {
      text: "Very transparent collaboration. Our web code is clean, without slow bloated dependencies, and our Google SEO rankings rose sharply within a month.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      name: "Anita Wijaya",
      role: "CTO ",
    },
    {
      text: "WhatsApp response automation from Lumovelo dramatically saved our CS team's operational time. Their AI integrations work very smartly and practically.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      name: "Rendra Kurniawan",
      role: "Director, Logistik Express",
    },
    {
      text: "Our website loading speed now gets an A grade on GTmetrix. Very impactful for our paid advertising which has become much more efficient and cheaper.",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
      name: "Hendra Wijaya",
      role: "Growth Lead ",
    },
    {
      text: "The automated online booking system integrated with WhatsApp significantly reduced bounce rates. Lumovelo truly understands our local business flow.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      name: "Siti Rahma",
      role: "Owner, BeautySalon & Spa",
    },
    {
      text: "The UI/UX design created by Lumovelo is very fresh and modern. Visitors stay longer on our web, bounce rates dropped by 40% in just a few weeks.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      name: "Dian",
      role: "Head of Marketing ",
    },
    {
      text: "We were highly helped by the custom CMS dashboard from Lumovelo. Now our admins can upload new products and update stock in just 2 clicks from their phone.",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
      name: "Agus Pratama",
      role: "Founder, CoffeeHouse Bandung",
    },
    {
      text: "The automated price calculator feature on the website is very helpful for potential buyers to make estimates before ordering. Innovative, responsive, and functional!",
      image: "https://images.unsplash.com/photo-1534751516642-a131ffd10795?w=150&h=150&fit=crop&crop=face",
      name: "Dewi Lestari",
      role: "Founder ",
    },
    {
      text: "Technical consultation with the Lumovelo team was very helpful. They recommended a serverless solution that keeps us from paying monthly hosting fees.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      name: "Faisal ",
      role: "Tech Lead ",
    },
  ],
};

const translations = {
  id: {
    badge: "Ulasan Klien",
    title: "Cerita Mitra Kami.",
    desc: "Dengarkan langsung cerita dari para pemilik bisnis dan pimpinan teknologi yang telah mempercayakan sistem digital mereka bersama kami.",
  },
  en: {
    badge: "Testimonials",
    title: "Our Partners' Stories.",
    desc: "Hear directly from business owners and tech leaders who have trusted their digital systems with us.",
  },
};

export const Testimonials = ({ lang = "id" }: TestimonialsProps) => {
  const activeLang = lang === "en" ? "en" : "id";
  const testimonials = testimonialsData[activeLang];
  const t = translations[activeLang];

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  return (
    <section className="bg-background relative !pt-2 sm:!pt-4 !pb-2 sm:!pb-4">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg font-mono text-xs uppercase tracking-widest text-primary border-primary/20 bg-primary/5">
              {t.badge}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5">
            {t.title}
          </h2>
          <p className="text-center mt-5 opacity-75 max-w-lg">
            {t.desc}
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default { Testimonials };

import * as React from "react";
import Index from "@/components/ui/travel-connect-signin-1";

function DemoAiAssistatBasic() {
  return (
    <Index />
  );
}

export { DemoAiAssistatBasic };
