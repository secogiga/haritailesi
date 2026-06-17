import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import SinavlarPageContent from '@/components/SinavlarPageContent';

export default function SinavlarPage() {
  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-sinavlar" />
      <SinavlarPageContent />
    </>
  );
}
