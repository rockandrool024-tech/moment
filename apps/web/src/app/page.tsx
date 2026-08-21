"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { CheckIcon, FilmIcon, ShareIcon, VerifiedIcon } from "@/components/icons";
import { BrandMark } from "@/components/BrandMark";
import { useLocale, type Locale } from "@/lib/locale-context";
import styles from "./home.module.css";

const landingCopy: Record<Locale, {
  watch: string; login: string; kicker: string; slogan: string; lede: string; startStory: string;
  watchLive: string; live: string; verifiedBrief: string; winnerPrize: string; leftToEnter: string;
  creators: string; prizeSecured: string; enterChallenge: string; howWorks: string; paid: string;
  paidToCreators: string; brandsPostBriefs: string; prizeFunded: string; creatorsSubmitWork: string;
  teaserRounds: string; strongestWorkWins: string; blindVotes: string;
}> = {
  en: {
    watch: "Watch", login: "Log in", kicker: "Live creative competitions", slogan: "Where stories become opportunities.",
    lede: "Create work people want to watch, share and remember. Build a track record through fair briefs, blind voting and real opportunities.",
    startStory: "Start your story", watchLive: "Watch live", live: "Live", verifiedBrief: "NOVA Studio · verified brief", winnerPrize: "Winner prize", leftToEnter: "left to enter", creators: "creators", prizeSecured: "Prize secured", enterChallenge: "Enter challenge", howWorks: "How it works", paid: "$84K paid", paidToCreators: "to creators this month", brandsPostBriefs: "Brands post real briefs", prizeFunded: "Every prize is funded before entries open.", creatorsSubmitWork: "Creators submit the work", teaserRounds: "Start with a short teaser, then advance through rounds.", strongestWorkWins: "The strongest work wins", blindVotes: "Blind votes protect quality from follower counts.",
  },
  fr: {
    watch: "Regarder", login: "Connexion", kicker: "Compétitions créatives en direct", slogan: "Là où les histoires deviennent des opportunités.",
    lede: "Créez des œuvres que l’on veut regarder, partager et retenir. Construisez votre parcours grâce à des briefs équitables, des votes aveugles et de vraies opportunités.",
    startStory: "Commencer votre histoire", watchLive: "Regarder en direct", live: "En direct", verifiedBrief: "NOVA Studio · brief vérifié", winnerPrize: "Prix du gagnant", leftToEnter: "pour participer", creators: "créateurs", prizeSecured: "Prix sécurisé", enterChallenge: "Participer au défi", howWorks: "Comment ça marche", paid: "84 k$ versés", paidToCreators: "aux créateurs ce mois-ci", brandsPostBriefs: "Les marques publient de vrais briefs", prizeFunded: "Chaque prix est financé avant l’ouverture des participations.", creatorsSubmitWork: "Les créateurs envoient leur travail", teaserRounds: "Commencez par un teaser court, puis avancez dans les manches.", strongestWorkWins: "Le meilleur travail gagne", blindVotes: "Les votes aveugles protègent la qualité des effets de popularité.",
  },
  ar: {
    watch: "شاهد", login: "تسجيل الدخول", kicker: "مسابقات إبداعية مباشرة", slogan: "حيث تتحول القصص إلى فرص.",
    lede: "أنشئ أعمالاً يرغب الناس في مشاهدتها ومشاركتها وتذكرها. ابنِ سجلك الإبداعي من خلال عروض عادلة وتصويت أعمى وفرص حقيقية.",
    startStory: "ابدأ قصتك", watchLive: "شاهد البث المباشر", live: "مباشر", verifiedBrief: "NOVA Studio · عرض موثّق", winnerPrize: "جائزة الفائز", leftToEnter: "متبقية للمشاركة", creators: "مبدعاً", prizeSecured: "الجائزة مؤمّنة", enterChallenge: "شارك في التحدي", howWorks: "كيف يعمل؟", paid: "تم دفع 84 ألف دولار", paidToCreators: "للمبدعين هذا الشهر", brandsPostBriefs: "تنشر العلامات التجارية عروضاً حقيقية", prizeFunded: "يتم تمويل كل جائزة قبل فتح المشاركات.", creatorsSubmitWork: "يقدم المبدعون أعمالهم", teaserRounds: "ابدأ بمقطع قصير ثم تقدم عبر الجولات.", strongestWorkWins: "يفوز العمل الأقوى", blindVotes: "التصويت الأعمى يحمي الجودة من تأثير عدد المتابعين.",
  },
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const { locale } = useLocale();
  const copy = landingCopy[locale];
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/challenges");
  }, [loading, user, router]);

  if (user) {
    return <div className={styles.loading}><div className={styles.loadingMark}><BrandMark /></div></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className="wordmark" aria-label="Perokio home"><BrandMark /></Link>
        <div className={styles.headerActions}>
          <Link href="/feed" className={styles.headerLink}>{copy.watch}</Link>
          <Link href="/login" className="btn secondary">{copy.login}</Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <div className={styles.kicker}><span className={styles.kickerDot} />{copy.kicker}</div>
            <h1 className={styles.title}>{copy.slogan}</h1>
            <p className={styles.lede}>{copy.lede}</p>
            <div className={styles.heroActions}>
              <Link href="/login" className="btn">{copy.startStory}</Link>
              <Link href="/feed" className="btn secondary"><FilmIcon width={18} height={18} aria-hidden />{copy.watchLive}</Link>
            </div>
          </div>

          <article className={styles.featured}>
            <div className={styles.media}>
              <span className={`badge badge-live ${styles.liveBadge}`}>{copy.live}</span>
              <div className={styles.mediaCopy}>
                <p>{copy.verifiedBrief}</p>
                <h2>Streetwear in motion</h2>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <div>
                  <span className={styles.prizeLabel}>{copy.winnerPrize}</span>
                  <div className={`${styles.prize} money`}>$5,000</div>
                </div>
                <div className={styles.countdown}>
                  <strong>18h 24m</strong>
                  <span>{copy.leftToEnter}</span>
                </div>
              </div>
              <div className={styles.cardMeta}>
                <span>126 {copy.creators}</span>
                <span><VerifiedIcon width={14} height={14} aria-hidden /> {copy.prizeSecured}</span>
              </div>
              <Link href="/login" className="btn btn-block">{copy.enterChallenge}</Link>
            </div>
          </article>
        </section>

        <section className={styles.proof} aria-label={copy.howWorks}>
          <div className={styles.proofCard}>
            <div>
              <div className={`${styles.proofValue} money`}>{copy.paid}</div>
              <p>{copy.paidToCreators}</p>
            </div>
            <ShareIcon width={32} height={32} aria-hidden />
          </div>
          <div className={styles.steps}>
            <h2>{copy.howWorks}</h2>
            <div className={styles.stepList}>
              <div className={styles.step}><span className={styles.stepNumber}>1</span><div><strong>{copy.brandsPostBriefs}</strong><span>{copy.prizeFunded}</span></div></div>
              <div className={styles.step}><span className={styles.stepNumber}>2</span><div><strong>{copy.creatorsSubmitWork}</strong><span>{copy.teaserRounds}</span></div></div>
              <div className={styles.step}><span className={styles.stepNumber}><CheckIcon width={17} height={17} aria-hidden /></span><div><strong>{copy.strongestWorkWins}</strong><span>{copy.blindVotes}</span></div></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
