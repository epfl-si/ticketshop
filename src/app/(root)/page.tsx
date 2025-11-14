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
				<p className="text-foreground/90 leading-relaxed mb-0">
					{translations.about.rich("description", {
						strong: (chunks) => <strong>{chunks}</strong>,
					})}
				</p>
				<p className="text-foreground/90 leading-relaxed">
					{translations.about("cffUsageTitle")}
				</p>
				<ul className="space-y-2">
					{translations.about.rich("cffUsage",
						{
							li: (chunks) => <li className="text-foreground/90">{chunks}</li>,
							i: (chunks) => <i>{chunks}</i>,
						})}
				</ul>
				<p className="text-foreground/90 leading-relaxed">
					{translations.about("additionalInfo")}
				</p>
			</section>
			<section className="space-y-4">
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
				<ul className="space-y-3 mt-4">
					<li className="text-foreground/90 leading-relaxed font-bold">
						{translations.help("helpSwissPassBuy")}
					</li>
					<li className="text-foreground/90 leading-relaxed">
						{translations.help.rich("helpMobility", {
							a: (chunks) => <a className="text-primary hover:underline" href={chunks?.toString().includes("@") ? `mailto:${chunks}` : chunks?.toString()} target="_blank">{chunks}</a>,
						})}
					</li>
					<li className="text-foreground/90 leading-relaxed">
						{translations.help.rich("helpTicketshopIssues", {
							a: (chunks) => <a className="text-primary hover:underline" href={`https://go.epfl.ch/${chunks}`} target="_blank">{chunks}</a>,
						})}
					</li>
					<li className="text-foreground/90 leading-relaxed">
						{translations.help.rich("helpAccredRights", {
							apostrophe: "'",
							i: (chunks) => <i className="text-foreground">{chunks}</i>,
						})}
					</li>
					<li className="text-foreground/90 leading-relaxed">
						{translations.help("helpSwissPass")}
					</li>
				</ul>
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
										a: (chunks) => (
											<a
												href={
													String(chunks).replaceAll(" ", "").toLowerCase() === "servicedesk" ?
														"mailto:1234@epfl.ch"
													: String(chunks).includes("www.") ?
														chunks?.toString()
														: `https://go.epfl.ch/${chunks}`}
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
				</div>
				<p className="text-foreground/90 leading-relaxed text-xs">
					{translations.tech.rich("paragraph", { a: (chunks) => <a className="text-primary hover:underline" href="https://nextjs.org/" target="_blank">{chunks}</a> })}
				</p>
			</section>
		</div>
	);
}
