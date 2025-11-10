import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslations, useMessages } from "next-intl";

export default function Info() {
	const translations = {
		about: useTranslations("info.about"),
		help: useTranslations("info.help"),
		faq: useTranslations("info.faq"),
		tech: useTranslations("info.tech"),
	};
	const messages = useMessages();

	return (
		<div className="container mx-auto p-6 space-y-6">
			<section className="space-y-4">
				<div>
					<h1 className="text-3xl font-semibold">
						{translations.about("title")}
					</h1>
				</div>
				<div className="space-y-4">
					<p className="text-foreground/90 leading-relaxed">
						{translations.about.rich("description", {
							strong: (chunks) => <strong>{chunks}</strong>,
						})}
					</p>
					<ul className="space-y-2">
						{translations.about.rich("ul1",
							{
								li: (chunks) => <li className="text-foreground/90">{chunks}</li>,
								i: (chunks) => <i>{chunks}</i>,
							})}
					</ul>
					<p className="text-foreground/90 leading-relaxed">
						{translations.about("additionalInfo")}
					</p>
				</div>
			</section>
			<section className="space-y-4">
				<div>
					<h2 className="text-2xl font-semibold">
						{translations.help("title")}
					</h2>
				</div>
				<div className="space-y-4">
					<p className="text-foreground/90 leading-relaxed">
						{translations.help.rich("availableHelp", {
							a: (chunks) => <a className="text-primary hover:underline" href="https://go.epfl.ch/KB0012580" target="_blank">{chunks}</a>,
						})}
					</p>
					<p className="text-foreground/90 leading-relaxed">
						{translations.help.rich("accredRequirement", {
							i: (chunks) => <i className="text-foreground">{chunks}</i>,
						})}
					</p>
					<p className="text-foreground/90 leading-relaxed">
						{translations.help.rich("supportIntro", {
							a: (chunks) => <a className="text-primary hover:underline" href="https://go.epfl.ch/KB0012580" target="_blank">{chunks}</a>,
						})}
					</p>
					<ul className="space-y-3 mt-4">
						<li className="text-foreground/90 leading-relaxed">
							{translations.help("helpSwissPass")}
						</li>
						<li className="text-foreground/90 leading-relaxed">
							{translations.help.rich("helpAccredRights", {
								apostrophe: "'",
								i: (chunks) => <i className="text-foreground">{chunks}</i>,
							})}
						</li>
						<li className="text-foreground/90 leading-relaxed">
							{translations.help("helpTicketshopIssues")}
						</li>
						<li className="text-foreground/90 leading-relaxed">
							{translations.help.rich("helpTechnicalContrib", {
								a: (chunks) => <a className="text-primary hover:underline" href={String(chunks).toLowerCase() === "GitHub" ? "https:/github.com/epfl-si/ticketshop" : "https:/github.com/epfl-si/ticketshop/issues"}>{chunks}</a>,
							})}
						</li>
					</ul>
				</div>
			</section>
			<h2 className="text-2xl font-semibold">{translations.faq("title")}</h2>
			<section className="w-full px-2">
				<Accordion type="single" collapsible className="mx-2">
					{Object.keys(messages.info.faq.questions).map((question) => (
						<AccordionItem value={question} key={question}>
							<AccordionTrigger>
								{translations.faq(`questions.${question}.title`)}
							</AccordionTrigger>
							<AccordionContent>
								{translations.faq.rich(
									`questions.${question}.description`,
									{
										LinkFAQ: (chunks) => (
											<a
												href={String(chunks).replaceAll(" ", "").toLowerCase() === "servicedesk" ? "mailto:1234@epfl.ch" : `https://go.epfl.ch/${chunks}`}
												className="text-primary hover:text-red-700 font-medium"
												target="_blank"
											>
												{chunks}
											</a>
										),
									},
								)}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-2xl font-semibold">
						{translations.tech("title")}
					</h2>
				</div>
				<p className="text-foreground/90 leading-relaxed">
					{translations.tech.rich("paragraph", { a: (chunks) => <a className="text-primary hover:underline" href="https://nextjs.org/" target="_blank">{chunks}</a> })}
				</p>
			</section>
		</div>
	);
}
