'use client'

import { Component, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Error Boundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-bg p-4">
                    <div className="max-w-md w-full bg-card rounded-2xl border border-borderc shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Algo deu errado</h2>
                        <p className="text-muted text-sm mb-6">
                            Ocorreu um erro inesperado. Por favor, tente recarregar a página.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
