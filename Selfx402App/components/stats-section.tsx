import { Card } from "@/components/ui/card"

const stats = [
  {
    value: "50,000+",
    label: "Verified Humans",
    description: "Real people saving money",
  },
  {
    value: "1000x",
    label: "Average Savings",
    description: "Compared to bot pricing",
  },
  {
    value: "2.5s",
    label: "Payment Speed",
    description: "Instant settlements",
  },
  {
    value: "500+",
    label: "APIs Available",
    description: "Growing marketplace",
  },
]

export function StatsSection() {
  return (
    <section className="py-16 border-t border-border/40">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.description}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
