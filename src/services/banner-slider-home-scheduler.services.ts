import { Server as SocketServer } from 'socket.io'
import bannerSliderHomeService from './banner-slider-home.services'

class BannerSliderHomeSchedulerService {
  private io: SocketServer | null = null
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  setSocketIO(io: SocketServer) {
    this.io = io
    this.startScheduler()
  }

  startScheduler() {
    if (this.isRunning) return

    this.isRunning = true
    console.log('🏠 Banner Slider Home scheduler started')

    // Check every minute for banners to auto-activate
    this.intervalId = setInterval(async () => {
      try {
        const result = await bannerSliderHomeService.activateBannersByTime()

        if (result.activated_count > 0) {
          console.log(`🎬 Auto-activated ${result.activated_count} banner slider home`)

          // Emit socket event to notify clients
          if (this.io) {
            this.io.emit('banner_slider_home_auto_activated', {
              activated_count: result.activated_count,
              activated_banners: result.activated_banners,
              timestamp: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error('❌ Error in banner slider home scheduler:', error)
      }
    }, 60000) // Check every minute
  }

  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.isRunning = false
      console.log('🏠 Banner Slider Home scheduler stopped')
    }
  }

  // Manual trigger for admin
  async triggerManualActivation() {
    try {
      const result = await bannerSliderHomeService.activateBannersByTime()

      if (this.io) {
        this.io.emit('banner_slider_home_manual_activation', {
          activated_count: result.activated_count,
          activated_banners: result.activated_banners,
          timestamp: new Date().toISOString(),
          triggered_by: 'admin'
        })
      }

      return result
    } catch (error) {
      console.error('❌ Error in manual banner slider home activation:', error)
      throw error
    }
  }

  // Get scheduler status
  getSchedulerStatus() {
    return {
      is_running: this.isRunning,
      socket_connected: this.io !== null,
      next_check: this.intervalId ? 'Running every minute' : 'Not scheduled'
    }
  }
}

const bannerSliderHomeSchedulerService = new BannerSliderHomeSchedulerService()
export default bannerSliderHomeSchedulerService