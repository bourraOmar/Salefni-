import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:3000'
const currencyFormatter = new Intl.NumberFormat('fr-MA', {
  style: 'currency',
  currency: 'MAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatCurrency = (value) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? currencyFormatter.format(numericValue) : '—'
}

const SimulatorPage = () => {
  const [creditTypes, setCreditTypes] = useState([])
  const [form, setForm] = useState({
    creditTypeId: '',
    amount: '',
    months: '',
    annualRate: '',
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadCreditTypes = async () => {
      try {
        const response = await fetch(`${API_URL}/creditTypes`)
        const data = await response.json()
        setCreditTypes(data)
        if (data.length > 0) {
          setForm({
            creditTypeId: data[0].id,
            amount: data[0].minAmount,
            months: Math.round(data[0].maxMonths / 2),
            annualRate: data[0].defaultAnnualRate,
          })
        }
      } catch (err) {
        console.error('Failed to load credit types', err)
        setError("Impossible de charger les types de crédit. Merci de réessayer plus tard.")
      }
    }

    loadCreditTypes()
  }, [])

  const selectedCredit = creditTypes.find((credit) => credit.id === form.creditTypeId) || null

  useEffect(() => {
    if (!selectedCredit) {
      return
    }

    setForm((prev) => ({
      ...prev,
      amount: prev.amount || selectedCredit.minAmount,
      months: prev.months || Math.round(selectedCredit.maxMonths / 2),
      annualRate: prev.annualRate || selectedCredit.defaultAnnualRate,
    }))
  }, [selectedCredit])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { creditTypeId, amount, months, annualRate } = form
      const credit = creditTypes.find((creditType) => creditType.id === creditTypeId)

      if (!credit || !amount || !months || !annualRate) {
        setError('Merci de compléter tous les champs.')
        return
      }

      const principal = Number(amount)
      const duration = Number(months)
      const annualRateValue = Number(annualRate)

      if (!Number.isFinite(principal) || !Number.isFinite(duration) || !Number.isFinite(annualRateValue)) {
        setError('Les valeurs saisies sont invalides.')
        return
      }

      if (principal < credit.minAmount || principal > credit.maxAmount) {
        setError(
          `Le montant doit être compris entre ${formatCurrency(credit.minAmount)} et ${formatCurrency(credit.maxAmount)}.`,
        )
        return
      }

      if (duration <= 0 || duration > credit.maxMonths) {
        setError(`La durée maximale autorisée pour ce crédit est de ${credit.maxMonths} mois.`)
        return
      }

      const monthlyRate = annualRateValue / 100 / 12
      const monthlyPayment =
        monthlyRate > 0
          ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration))
          : principal / duration
      const totalPaid = monthlyPayment * duration
      const totalInterest = totalPaid - principal
      const amortization = []
      let remainingBalance = principal

      for (let month = 1; month <= Math.min(duration, 6); month += 1) {
        const interest = monthlyRate > 0 ? remainingBalance * monthlyRate : 0
        const principalPayment = monthlyPayment - interest
        remainingBalance = Math.max(remainingBalance - principalPayment, 0)
        amortization.push({
          month,
          interest,
          principal: principalPayment,
          remaining: remainingBalance,
        })
      }

      setResult({
        monthlyPayment,
        totalPaid,
        totalInterest,
        duration,
        annualRate: annualRateValue,
        amortization,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const suggestionItems = selectedCredit
    ? [
        {
          label: 'Montant minimum',
          value: formatCurrency(selectedCredit.minAmount),
        },
        {
          label: 'Montant maximum',
          value: formatCurrency(selectedCredit.maxAmount),
        },
        {
          label: 'Durée maximale',
          value: `${selectedCredit.maxMonths} mois`,
        },
        {
          label: 'Taux de référence',
          value: `${selectedCredit.defaultAnnualRate}%`,
        },
      ]
    : []

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <header className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">Calculez en confiance</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Simulateur de crédit intelligent</h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Ajustez le montant, la durée et le taux pour visualiser instantanément vos mensualités et le coût total de
              votre financement. Nos paramètres se mettent à jour selon le produit choisi pour rester dans les limites
              autorisées.
            </p>
          </div>
          <ul className="grid w-full max-w-sm grid-cols-1 gap-3 text-sm text-slate-600">
            <li className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
              <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-500/10 font-semibold text-indigo-600">
                1
              </span>
              <span>Choisissez un type de crédit</span>
            </li>
            <li className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-500/10 font-semibold text-slate-600">
                2
              </span>
              <span>Saisissez vos paramètres personnalisés</span>
            </li>
            <li className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-500/10 font-semibold text-emerald-600">
                3
              </span>
              <span>Visualisez les mensualités et le coût total</span>
            </li>
          </ul>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/50 backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Paramètres</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Configurez votre simulation</h2>
              </div>
              {isSubmitting && (
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">Calcul en cours…</span>
              )}
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
                {error}
              </div>
            )}

            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                <span>Type de crédit</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  name="creditTypeId"
                  value={form.creditTypeId}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Sélectionnez un produit
                  </option>
                  {creditTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                <span>Montant souhaité</span>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-14 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    min={selectedCredit?.minAmount || 0}
                    max={selectedCredit?.maxAmount || undefined}
                    required
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-xs font-semibold text-slate-400">
                    MAD
                  </span>
                </div>
                <span className="text-xs font-normal text-slate-500">
                  Entre {formatCurrency(selectedCredit?.minAmount)} et {formatCurrency(selectedCredit?.maxAmount)}
                </span>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                <span>Durée de remboursement</span>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-12 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    type="number"
                    name="months"
                    value={form.months}
                    onChange={handleChange}
                    min={6}
                    max={selectedCredit?.maxMonths || undefined}
                    required
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-xs font-semibold text-slate-400">
                    mois
                  </span>
                </div>
                <span className="text-xs font-normal text-slate-500">
                  Durée maximale&nbsp;: {selectedCredit?.maxMonths || '—'} mois
                </span>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                <span>Taux annuel</span>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-12 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    type="number"
                    name="annualRate"
                    value={form.annualRate}
                    onChange={handleChange}
                    min={0}
                    step={0.1}
                    required
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-xs font-semibold text-slate-400">
                    %
                  </span>
                </div>
                <span className="text-xs font-normal text-slate-500">
                  Valeur indicative&nbsp;: {selectedCredit?.defaultAnnualRate || '—'}%
                </span>
              </label>

              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-500">
                  La simulation est indicative et n&apos;engage pas l&apos;organisme de crédit.
                </p>
                <button
                  className="inline-flex items-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Calcul en cours…' : 'Calculer les mensualités'}
                </button>
              </div>
            </form>
          </div>

          {result && (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-6 shadow-xl shadow-emerald-200/40">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Résultat</p>
                  <h3 className="mt-2 text-2xl font-semibold text-emerald-900">
                    {formatCurrency(result.monthlyPayment)}
                    <span className="ml-2 text-sm font-normal text-emerald-600">par mois</span>
                  </h3>
                  <p className="mt-2 text-sm text-emerald-700">
                    Basé sur {result.duration} mois à un taux annuel de {result.annualRate}%
                  </p>
                </div>
                <div className="grid w-full gap-3 sm:grid-cols-2 md:max-w-md">
                  <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Coût total</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(result.totalPaid)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Intérêts estimés</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(result.totalInterest)}</p>
                  </div>
                </div>
              </div>
              {result.amortization.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Aperçu amortissement (6 premiers mois)</p>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Mois</th>
                          <th className="px-4 py-3">Intérêts</th>
                          <th className="px-4 py-3">Capital</th>
                          <th className="px-4 py-3">Restant dû</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.amortization.map((row) => (
                          <tr key={row.month} className="odd:bg-white even:bg-slate-50/80">
                            <td className="px-4 py-2 font-medium text-slate-700">{row.month}</td>
                            <td className="px-4 py-2">{formatCurrency(row.interest)}</td>
                            <td className="px-4 py-2">{formatCurrency(row.principal)}</td>
                            <td className="px-4 py-2">{formatCurrency(row.remaining)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/50">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Repères produit</h3>
            <p className="mt-2 text-sm text-slate-600">
              Les limites ci-dessous s&apos;adaptent automatiquement au crédit sélectionné afin de garantir une simulation
              cohérente.
            </p>
            <ul className="mt-4 grid gap-3 text-sm text-slate-700">
              {suggestionItems.map((item) => (
                <li
                  key={item.label}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                </li>
              ))}
              {suggestionItems.length === 0 && (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Sélectionnez un type de crédit pour voir ses limites.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 shadow-lg shadow-indigo-200/40">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-500">Astuce</h3>
            <p className="mt-2 text-sm text-indigo-700">
              Ajustez le montant et la durée par petites variations pour identifier le point d&apos;équilibre entre
              mensualités confortables et coût total optimisé.
            </p>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default SimulatorPage
