import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import ThemeToggle from '../shared/ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('reads saved theme from localStorage and applies dark class', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeToggle />)
    const btn = screen.getByRole('button')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    // Button uses an aria-label for accessible name instead of visible text
    expect(btn.getAttribute('aria-label')).toBe('Switch to light mode')
  })

  it('toggles theme and updates localStorage', () => {
    render(<ThemeToggle />)
    const btn = screen.getByRole('button')
    // default should be light (no class)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // toggle to dark
    fireEvent.click(btn)
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // toggle back to light
    fireEvent.click(btn)
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
