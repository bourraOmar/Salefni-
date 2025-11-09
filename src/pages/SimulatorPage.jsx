import { useEffect, useMemo, useState } from 'react'

const API_URL = 'http://localhost:3000'

const initialSimulationForm = {
  creditTypeId: '',
  amount: '',
  months: '',
  annualRate: '',
  fees: '',
  insuranceRate: '',
}

const SimulatorPage = () => {
  const [creditTypes, setCreditTypes] = useState([])
  const [simulationForm, setSimulationForm] = useState(initialSimulationForm)
  const [simulationResult, setSimulationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/creditTypes`)
        const creditList = await response.json()

        setCreditTypes(creditList)

        if (creditList.length > 0) {
          const defaultType = creditList[0]
          setSimulationForm({
            creditTypeId: defaultType.id,
            amount: defaultType.minAmount,
            months: Math.min(60, defaultType.maxMonths),
            annualRate: defaultType.defaultAnnualRate,
            fees: defaultType.defaultFees,
            insuranceRate: defaultType.defaultInsuranceRate,
          })
        }
      } catch (error) {
        console.error('Failed to load metadata', error)
        setFeedback({ type: 'error', message: "Impossible de récupérer les données initiales." })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!simulationForm.creditTypeId) {
      return
    }

    const selectedType = creditTypes.find((type) => type.id === simulationForm.creditTypeId)
    if (!selectedType) {
      return
    }

    setSimulationForm((prev) => ({
      ...prev,
      annualRate: prev.annualRate || selectedType.defaultAnnualRate,
      fees: prev.fees || selectedType.defaultFees,
      insuranceRate: prev.insuranceRate || selectedType.defaultInsuranceRate,
    }))
  }, [simulationForm.creditTypeId, creditTypes])

  const selectedCreditType = useMemo(
    () => creditTypes.find((type) => type.id === simulationForm.creditTypeId) || null,
    [creditTypes, simulationForm.creditTypeId],
  )

  const handleSimulationInput = (event) => {
    const { name, value } = event.target
    setSimulationForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const calculateSimulation = (event) => {
    event.preventDefault()
    setFeedback(null)

    const amount = Number(simulationForm.amount)
    const months = Number(simulationForm.months)
    const annualRate = Number(simulationForm.annualRate)
    const fees = Number(simulationForm.fees || 0)
    const insuranceRate = Number(simulationForm.insuranceRate || 0)

    if (!amount || !months || !selectedCreditType) {
      setFeedback({ type: 'error', message: 'Merci de compléter tous les champs obligatoires.' })
      return
    }

    if (amount < selectedCreditType.minAmount || amount > selectedCreditType.maxAmount) {
      setFeedback({
        type: 'error',
        message: `Le montant doit être compris entre ${formatCurrency(selectedCreditType.minAmount)} et ${formatCurrency(selectedCreditType.maxAmount)}.`,
      })
      return
    }

    if (months > selectedCreditType.maxMonths) {
      setFeedback({
        type: 'error',
        message: `La durée maximale pour ce crédit est de ${selectedCreditType.maxMonths} mois.`,
      })
      return
    }

    const monthlyRate = annualRate ? annualRate / 100 / 12 : 0
    let baseMonthly = 0
    if (monthlyRate > 0) {
      baseMonthly = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
    } else {
      baseMonthly = amount / months
    }

    const insuranceMonthly = insuranceRate ? (amount * (insuranceRate / 100)) / 12 : 0
    const monthlyWithInsurance = baseMonthly + insuranceMonthly
    const totalInsurance = insuranceMonthly * months
    const totalRepaid = baseMonthly * months
    const totalCost = totalRepaid + totalInsurance + fees
    const totalInterest = totalRepaid - amount
    const apr = months ? ((totalCost - amount) / amount) / (months / 12) * 100 : 0

    let remaining = amount
    const schedule = []
    for (let month = 1; month <= Math.min(6, months); month += 1) {
      const interest = remaining * monthlyRate
      const principal = baseMonthly - interest
      remaining = Math.max(0, remaining - principal)
      schedule.push({
        month,
        interest: Number(interest.toFixed(2)),
        principal: Number(principal.toFixed(2)),
        remaining: Number(remaining.toFixed(2)),
      })
      if (remaining <= 0) {
        break
      }
    }

    const now = new Date().toISOString()

    const computedSimulation = {
      creditTypeId: simulationForm.creditTypeId,
      amount,
      months,
      annualRate,
      fees,
      insuranceRate,
      monthlyPayment: Number(baseMonthly.toFixed(2)),
      monthlyPaymentWithInsurance: Number(monthlyWithInsurance.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
      totalInsurance: Number(totalInsurance.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      apr: Number(apr.toFixed(2)),
      amortization: schedule,
      createdAt: now,
    }

    setSimulationResult(computedSimulation)
  }

  if (loading && creditTypes.length === 0) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-5xl items-center justify-center text-sm text-slate-500">
        <p>Chargement des données…</p>
      </div>
    )
  }

  const feedbackClassName =
    feedback?.type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-rose-200 bg-rose-50 text-rose-700'

  const fieldClasses =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Outil en ligne</p>
          <h1 className="text-3xl font-semibold text-slate-900">Simulateur de crédit</h1>
          <p className="text-sm text-slate-500">Renseignez les informations pour estimer vos mensualités.</p>
        </div>
      </header>

      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${feedbackClassName}`}>
          {feedback.message}
        </div>
      )}

      <section
        id="simulation"
        className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-200/60 backdrop-blur"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Calcul instantané</p>
            <h2 className="text-xl font-semibold text-slate-900">Simulation</h2>
          </div>
        </div>

        <form className="flex flex-col gap-6" onSubmit={calculateSimulation}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              <span>Type de crédit</span>
              <select
                className={fieldClasses}
                name="creditTypeId"
                value={simulationForm.creditTypeId}
                onChange={handleSimulationInput}
                required
              >
                <option value="" disabled>
                  Sélectionnez un crédit
                </option>
                {creditTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              <span>Montant (MAD)</span>
              <input
                className={fieldClasses}
                type="number"
                name="amount"
                min={selectedCreditType?.minAmount || 0}
                max={selectedCreditType?.maxAmount || undefined}
                value={simulationForm.amount}
                onChange={handleSimulationInput}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              <span>Durée (mois)</span>
              <input
                className={fieldClasses}
                type="number"
                name="months"
                min={6}
                max={selectedCreditType?.maxMonths || undefined}
                value={simulationForm.months}
                onChange={handleSimulationInput}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              <span>Taux annuel (%)</span>
              <input
                className={fieldClasses}
                type="number"
                name="annualRate"
                min={0}
                step={0.1}
                value={simulationForm.annualRate}
                onChange={handleSimulationInput}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              <span>Frais fixes (MAD)</span>
              <input
                className={fieldClasses}
                type="number"
                name="fees"
                min={0}
                value={simulationForm.fees}
                onChange={handleSimulationInput}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              <span>Assurance (%)</span>
              <input
                className={fieldClasses}
                type="number"
                name="insuranceRate"
                min={0}
                step={0.05}
                value={simulationForm.insuranceRate}
                onChange={handleSimulationInput}
              />
            </label>
          </div>

          <button
            className="inline-flex items-center self-start rounded-full border border-indigo-100 bg-indigo-50 px-5 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            type="submit"
          >
            Calculer
          </button>
        </form>

        {simulationResult && (
          <div className="mt-8 flex flex-col gap-6 border-t border-slate-100 pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mensualité</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(simulationResult.monthlyPayment)} <span className="text-sm text-slate-500">/ mois</span>
                </p>
                {simulationResult.monthlyPaymentWithInsurance !== simulationResult.monthlyPayment && (
                  <p className="mt-1 text-xs text-slate-500">
                    Avec assurance&nbsp;: {formatCurrency(simulationResult.monthlyPaymentWithInsurance)} / mois
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coût total</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCurrency(simulationResult.totalCost)}</p>
                <p className="mt-1 text-xs text-slate-500">Dont intérêts&nbsp;: {formatCurrency(simulationResult.totalInterest)}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">TAEG estimé</p>
                <p className="text-2xl font-semibold text-slate-900">{simulationResult.apr}%</p>
              </div>
            </div>

            {simulationResult.amortization.length > 0 && (
              <div>
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
                      {simulationResult.amortization.map((row) => (
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
      </section>
    </div>
  )
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(Number(value))
}

export default SimulatorPage
