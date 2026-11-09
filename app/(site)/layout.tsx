import { Cursor } from "@/components/cursor";
import { ReserveDialog } from "@/components/reserve/reserve-dialog";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Preloader } from "@/components/preloader";

/** Marketing site chrome. The table QR menu (/t) and staff pages (/admin) live outside this group, without it. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Preloader />
      <Navbar />
      {children}
      <Footer />
      <ReserveDialog />
      <Cursor />
    </>
  );
}
